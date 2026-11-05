/**
 * Test de estrés de POST /api/tramites/consultar con autocannon.
 *
 * Levanta el backend real en un proceso aparte (puerto 3001), le aplica carga
 * escalonada (10 → 50 → 200 → 500 conexiones) y un escenario de abuso con
 * consultas muy largas, imprime una tabla Markdown y apaga el servidor.
 *
 * Sale con código 1 si los niveles 10, 50 o 200 no cumplen: 0 errores,
 * 0 timeouts, 0 respuestas no-2xx y p99 < 500 ms. El nivel 500 y el abuso solo
 * se reportan.
 */
import { spawn, type ChildProcess } from "node:child_process";
import net from "node:net";
import path from "node:path";
// autocannon no trae tipos; tsx no hace type-check.
// @ts-ignore
import autocannon from "autocannon";

const PUERTO = 3001;
const BASE = `http://localhost:${PUERTO}`;
const URL_CONSULTA = `${BASE}/api/tramites/consultar`;
const PLAZO_INICIO_MS = 10_000;
const DURACION_S = 20;
const P99_MAXIMO_MS = 500;
const NIVELES_CON_META = [10, 50, 200];
const NIVEL_QUIEBRE = 500;

// Consultas que recorren los caminos del buscador: ok, ambiguo, sin-match,
// faltas de ortografía y un trámite del catálogo por su nombre.
const CONSULTAS = [
  "quiero sacar mi primera licencia clase B",
  "renovar permiso de circulación",
  "sacar licencia clase B",
  "horario de la piscina municipal",
  "renobar lisencia clase b",
  "Solicitud licencia clase D",
];

const peticiones = CONSULTAS.map((pregunta) => ({
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ pregunta }),
}));

// ~20.000 caracteres de palabras de 5 a 8 letras (sin dígitos, para que pasen
// por la corrección ortográfica) que no están en el vocabulario de trámites.
function preguntaLarga(): string {
  const palabras: string[] = [];
  let largo = 0;
  for (let i = 0; largo < 20_000; i++) {
    let sufijo = "";
    for (let n = i; sufijo.length < 2 + (i % 4); n = Math.floor(n / 26)) {
      sufijo += String.fromCharCode(97 + (n % 26));
    }
    const palabra = `zqx${sufijo}`;
    palabras.push(palabra);
    largo += palabra.length + 1;
  }
  return palabras.join(" ");
}

interface Fila {
  escenario: string;
  conexiones: number;
  reqPorSeg: number;
  p50: number;
  p99: number;
  max: number;
  total: number;
  errores: number;
  timeouts: number;
  no2xx: number;
}

function fila(escenario: string, conexiones: number, r: any): Fila {
  return {
    escenario,
    conexiones,
    reqPorSeg: Math.round(r.requests.average),
    p50: r.latency.p50,
    p99: r.latency.p99,
    max: r.latency.max,
    total: r.requests.total,
    errores: r.errors,
    timeouts: r.timeouts,
    no2xx: r.non2xx,
  };
}

function cargar(connections: number, duration: number, requests = peticiones) {
  return autocannon({ url: URL_CONSULTA, connections, duration, requests });
}

function puertoLibre(): Promise<boolean> {
  return new Promise((resolve) => {
    const prueba = net.createServer();
    prueba.once("error", () => resolve(false));
    prueba.once("listening", () => prueba.close(() => resolve(true)));
    prueba.listen(PUERTO);
  });
}

// Listo solo si ESTE proceso imprimió que escucha y /api/health responde 200.
function iniciarServidor(): Promise<ChildProcess> {
  const backend = path.resolve(__dirname, "../..");
  const hijo = spawn(process.execPath, ["--import", "tsx", "src/index.ts"], {
    cwd: backend,
    stdio: ["ignore", "pipe", "pipe"],
  });
  servidorActivo = hijo;

  return new Promise((resolve, reject) => {
    const limite = Date.now() + PLAZO_INICIO_MS;
    let escuchando = false;
    let terminado = false;

    const fallar = (motivo: string) => {
      if (terminado) return;
      terminado = true;
      hijo.kill();
      reject(new Error(motivo));
    };

    hijo.stdout!.on("data", (d) => {
      if (String(d).includes("Backend escuchando")) escuchando = true;
    });
    hijo.stderr!.on("data", (d) => {
      if (String(d).includes("EADDRINUSE")) fallar("El puerto 3001 se ocupó al iniciar.");
    });
    hijo.once("error", (e) => fallar(`No se pudo lanzar el backend: ${e.message}`));
    hijo.once("exit", (code) => fallar(`El backend terminó al iniciar (código ${code}).`));

    const revisar = async () => {
      if (terminado) return;
      const restante = limite - Date.now();
      if (restante <= 0) return fallar("El backend no estuvo listo en 10 s.");
      if (escuchando) {
        try {
          const res = await fetch(`${BASE}/api/health`, {
            signal: AbortSignal.timeout(Math.min(1000, restante)),
          });
          if (res.ok && !terminado) {
            terminado = true;
            hijo.removeAllListeners("exit");
            return resolve(hijo);
          }
        } catch {
          // aún no responde
        }
      }
      setTimeout(revisar, 200);
    };
    revisar();
  });
}

// Espera a que el backend termine las consultas que quedaron en cola del
// escenario anterior: /api/health corre en el mismo event loop, así que solo
// responde rápido cuando la cola está vacía.
async function esperarReposo(): Promise<void> {
  const limite = Date.now() + 60_000;
  while (Date.now() < limite) {
    const inicio = performance.now();
    try {
      const res = await fetch(`${BASE}/api/health`, { signal: AbortSignal.timeout(5000) });
      if (res.ok && performance.now() - inicio < 50) return;
    } catch {
      // sigue ocupado
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error("El backend no se desocupó en 60 s entre escenarios.");
}

let servidorActivo: ChildProcess | null = null;

// Apaga el backend y espera a que termine; si no responde en 3 s, lo fuerza.
async function detenerServidor(): Promise<void> {
  const hijo = servidorActivo;
  servidorActivo = null;
  if (!hijo || hijo.exitCode !== null || hijo.signalCode !== null) return;
  const termino = new Promise((r) => hijo.once("exit", r));
  hijo.kill("SIGTERM");
  const aTiempo = await Promise.race([
    termino.then(() => true),
    new Promise((r) => setTimeout(() => r(false), 3000)),
  ]);
  if (!aTiempo) {
    hijo.kill("SIGKILL");
    await termino;
  }
}

for (const senal of ["SIGINT", "SIGTERM"] as const) {
  process.once(senal, () => {
    console.error(`\nInterrumpido (${senal}), apagando el backend...`);
    detenerServidor().finally(() => process.exit(130));
  });
}

function tabla(filas: Fila[]): string {
  const encabezado =
    "| Escenario | Conexiones | Req/s | p50 (ms) | p99 (ms) | Máx (ms) | Peticiones | Errores | Timeouts | No-2xx |\n" +
    "|---|---|---|---|---|---|---|---|---|---|";
  const cuerpo = filas.map(
    (f) =>
      `| ${f.escenario} | ${f.conexiones} | ${f.reqPorSeg} | ${f.p50} | ${f.p99} | ${f.max} | ${f.total} | ${f.errores} | ${f.timeouts} | ${f.no2xx} |`
  );
  return [encabezado, ...cuerpo].join("\n");
}

async function main(): Promise<number> {
  if (!(await puertoLibre())) {
    console.error(
      "Hay otro proceso usando el puerto 3001 (¿npm run dev abierto?). Ciérralo y vuelve a correr el test."
    );
    return 2;
  }

  const servidor = await iniciarServidor();
  servidorActivo = servidor;
  let caido = false;
  servidor.once("exit", () => (caido = true));
  const filas: Fila[] = [];

  try {
    console.log("Calentamiento: 5 s a 10 conexiones...");
    await cargar(10, 5);

    for (const conexiones of [...NIVELES_CON_META, NIVEL_QUIEBRE]) {
      await esperarReposo();
      console.log(`Nivel ${conexiones} conexiones, ${DURACION_S} s...`);
      filas.push(fila("Carga", conexiones, await cargar(conexiones, DURACION_S)));
      if (caido) throw new Error("El backend se cayó durante la carga.");
    }

    await esperarReposo();
    console.log(`Abuso: 10 conexiones normales + 2 con consultas largas, ${DURACION_S} s...`);
    const larga = [
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ pregunta: preguntaLarga() }),
      },
    ];
    const [normal, abuso] = await Promise.all([
      cargar(10, DURACION_S),
      cargar(2, DURACION_S, larga),
    ]);
    if (caido) throw new Error("El backend se cayó durante el abuso.");
    filas.push(fila("Abuso: usuarios normales", 10, normal));
    filas.push(fila("Abuso: consultas largas", 2, abuso));
  } finally {
    await detenerServidor();
  }

  console.log("\n" + tabla(filas) + "\n");

  const fallidos = filas.filter(
    (f) =>
      f.escenario === "Carga" &&
      NIVELES_CON_META.includes(f.conexiones) &&
      (f.errores > 0 || f.timeouts > 0 || f.no2xx > 0 || f.p99 >= P99_MAXIMO_MS)
  );
  if (fallidos.length > 0) {
    console.error(
      `No cumple la meta (0 errores y p99 < ${P99_MAXIMO_MS} ms) en: ${fallidos
        .map((f) => f.conexiones)
        .join(", ")} conexiones.`
    );
    return 1;
  }
  console.log(`Cumple la meta en ${NIVELES_CON_META.join(", ")} conexiones.`);
  return 0;
}

main()
  .then((codigo) => process.exit(codigo))
  .catch(async (e) => {
    console.error(e instanceof Error ? e.message : e);
    await detenerServidor();
    process.exit(1);
  });
