import { existsSync, readFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { homedir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Configuración de la fuente de datos.
 *
 * Los JSON de `src/data` siguen siendo el respaldo cuando Praxsuite no está
 * configurado o no responde, de modo que los tests y el desarrollo local no
 * dependen de la red.
 */

const aqui = dirname(fileURLToPath(import.meta.url)); // backend/src

function cargarEnv(): void {
  const candidatos = [
    resolve(aqui, "../.env"), // backend/.env
    resolve(aqui, "../../.env"), // raíz del repositorio
    resolve(process.cwd(), ".env"),
    resolve(process.cwd(), "backend/.env"),
  ];
  for (const ruta of candidatos) {
    if (!existsSync(ruta)) continue;
    try {
      process.loadEnvFile(ruta);
    } catch {
      // Un .env ilegible no debe impedir el arranque.
    }
    break;
  }
}

// Los tests fijan PRAXSUITE_DISABLED=1 para no depender de la red.
if (process.env.PRAXSUITE_DISABLED !== "1") {
  cargarEnv();
}

function expandirRuta(ruta: string): string {
  if (ruta === "~") return homedir();
  if (ruta.startsWith("~/")) return resolve(homedir(), ruta.slice(2));
  return resolve(ruta);
}

function leerApiKey(): string {
  if (process.env.PRAXSUITE_DISABLED === "1") return "";

  const directa = process.env.PRAXSUITE_API_KEY?.trim();
  if (directa) return directa;

  const archivo = process.env.PRAXSUITE_API_KEY_FILE?.trim();
  if (!archivo) return "";

  try {
    return readFileSync(expandirRuta(archivo), "utf8").trim();
  } catch {
    console.warn(`Praxsuite: no se pudo leer la API key desde '${archivo}'.`);
    return "";
  }
}

function numero(valor: string | undefined, porDefecto: number): number {
  const n = Number(valor);
  return Number.isFinite(n) && n > 0 ? n : porDefecto;
}

const WORKSPACE = "ce9ad0db-ae38-45b8-9f83-17ada629fad9";

export const praxsuite = {
  gatewayUrl:
    process.env.PRAXSUITE_GATEWAY_URL?.trim().replace(/\/+$/, "") ||
    `https://gateway.praxsuite.com/${WORKSPACE}`,
  apiKey: leerApiKey(),
  tablas: {
    tramites:
      process.env.PRAXSUITE_TABLE_TRAMITES?.trim() ||
      "6034e65d-c034-4748-adac-70cbd870196b",
    clases:
      process.env.PRAXSUITE_TABLE_CLASES?.trim() ||
      "e3b6afa5-0f4c-42f4-a38f-067e9ebc93e2",
    alias:
      process.env.PRAXSUITE_TABLE_ALIAS?.trim() ||
      "5ac825de-0095-4c31-8698-cff7d29a54df",
    tramiteClase:
      process.env.PRAXSUITE_TABLE_TRAMITE_CLASE?.trim() ||
      "d67f236b-7c97-46bb-aada-3c1affaa5d5d",
    requisitos:
      process.env.PRAXSUITE_TABLE_REQUISITOS?.trim() ||
      "70bde8de-82f3-4825-80b2-dae337741d90",
    pasos:
      process.env.PRAXSUITE_TABLE_PASOS?.trim() ||
      "53e3a700-e1df-4072-bc4e-938e1795beb7",
  },
  cacheTtlMs: numero(process.env.PRAXSUITE_CACHE_TTL_MS, 5 * 60 * 1000),
  get habilitado(): boolean {
    return this.apiKey.length > 0 && this.gatewayUrl.length > 0;
  },
};

// ---------------------------------------------------------------------------
// Panel de funcionarios (US-05): los vecinos no inician sesión.
// ---------------------------------------------------------------------------

/**
 * Secreto para firmar los JWT.
 *
 * Si `JWT_SECRET` no está definido se genera uno efímero: el servidor arranca
 * igual (sin secretos en el repositorio) pero las sesiones se cierran al
 * reiniciar. En producción siempre hay que definirlo en `backend/.env`.
 */
const secretoEfímero = randomBytes(32).toString("base64url");

export const panel = {
  /** Vigencia de la sesión del funcionario (por defecto, una jornada laboral). */
  ttlMinutos: numero(process.env.PANEL_TOKEN_TTL_MINUTOS, 8 * 60),
  secreto: process.env.JWT_SECRET?.trim() || secretoEfímero,
  secretoEfímero: !process.env.JWT_SECRET?.trim(),
  /** Intentos fallidos de login permitidos antes de bloquear (ventana fija). */
  intentosMaximos: numero(process.env.PANEL_INTENTOS_MAXIMOS, 5),
  ventanaIntentosMs: numero(process.env.PANEL_VENTANA_INTENTOS_MS, 15 * 60 * 1000),
  /** Rutas de los archivos locales (sobrescribibles para los tests). */
  fichasJson: process.env.FICHAS_JSON_RUTA?.trim() || resolve(aqui, "./data/fichas.json"),
  catalogoJson: process.env.CATALOGO_JSON_RUTA?.trim() || resolve(aqui, "./data/catalogo.json"),
  usuariosJson: process.env.USUARIOS_JSON_RUTA?.trim() || resolve(aqui, "./data/usuarios.json"),
};

if (panel.secretoEfímero) {
  console.warn(
    "JWT_SECRET no está definido: se usa un secreto temporal y las sesiones " +
      "del panel se cerrarán al reiniciar el servidor."
  );
}

export const usuarios = {
  /** Tabla de funcionarios en Praxsuite (solo lectura de usuarios: login). */
  tabla:
    process.env.PRAXSUITE_TABLE_USUARIOS?.trim() || "Usuarios",
};
