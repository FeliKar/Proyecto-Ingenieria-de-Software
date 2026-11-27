import { praxsuite } from "../config";

/**
 * Escritura en Praxsuite (US-05).
 *
 * El gateway DataEngine expone `POST /{workspaceId}/query` y acepta PraxQL,
 * el dialecto SQL del producto, con soporte de INSERT, UPDATE y DELETE
 * (ver https://gateway.praxsuite.com/openapi.json).
 *
 * Los identificadores de tabla vienen de la configuración (`PRAXSUITE_TABLE_*`);
 * los valores siempre se escriben entre comillas simples y con los `'`
 * duplicados, que es la forma de escapar de PraxQL. Ningún valor del usuario
 * se concatena sin escapar.
 */

type Fila = Record<string, unknown>;

/** `POST /{workspaceId}/query` con una sentencia PraxQL. */
export async function ejecutarPraxql(sql: string): Promise<Fila[]> {
  const respuesta = await fetch(`${praxsuite.gatewayUrl}/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${praxsuite.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: sql }),
  });

  if (!respuesta.ok) {
    const detalle = await respuesta.text().catch(() => "");
    throw new Error(
      `Praxsuite rechazó la escritura (${respuesta.status})${
        detalle ? `: ${detalle.slice(0, 300)}` : ""
      }`
    );
  }

  const cuerpo = (await respuesta.json()) as { rows?: Fila[] };
  return cuerpo.rows ?? [];
}

/** Literal de texto de PraxQL: `'...'` con las comillas simples duplicadas. */
export function texto(valor: string): string {
  return `'${valor.replace(/'/g, "''")}'`;
}

/** Literal booleano/numérico seguro para los pocos campos no textuales. */
export function literal(valor: unknown): string {
  if (typeof valor === "boolean") return valor ? "true" : "false";
  if (typeof valor === "number" && Number.isFinite(valor)) return String(valor);
  return "''";
}

// -------------------------- operaciones de fichas ---------------------------

const t = praxsuite.tablas;

/** Id interno de la fila de trámites (las relaciones apuntan a ese id). */
async function idInternoDe(codigo: string): Promise<string | null> {
  const filas = await ejecutarPraxql(
    `SELECT ID FROM ${t.tramites} WHERE Codigo = ${texto(codigo)} LIMIT 1`
  );
  const id = filas[0]?.ID ?? filas[0]?.id;
  return typeof id === "string" && id.length > 0 ? id : null;
}

interface CamposTramite {
  tramite: string;
  vigencia: string;
  enlace: string;
  soloEnlace: boolean;
}

async function insertarTramite(
  codigo: string,
  campos: CamposTramite
): Promise<void> {
  await ejecutarPraxql(
    `INSERT INTO ${t.tramites} (Codigo, Nombre, Vigencia, EnlaceOficial, Solo_Enlace) ` +
      `VALUES (${texto(codigo)}, ${texto(campos.tramite)}, ${texto(
        campos.vigencia
      )}, ${texto(campos.enlace)}, ${literal(campos.soloEnlace)})`
  );
}

async function actualizarTramite(
  codigo: string,
  campos: CamposTramite
): Promise<void> {
  await ejecutarPraxql(
    `UPDATE ${t.tramites} SET Nombre = ${texto(campos.tramite)}, ` +
      `Vigencia = ${texto(campos.vigencia)}, ` +
      `EnlaceOficial = ${texto(campos.enlace)}, ` +
      `Solo_Enlace = ${literal(campos.soloEnlace)} ` +
      `WHERE Codigo = ${texto(codigo)}`
  );
}

/** Reemplaza las filas hijas de una ficha por las nuevas. */
async function reemplazarFilas(
  tabla: string,
  columna: string,
  idTramite: string,
  descripciones: string[]
): Promise<void> {
  await ejecutarPraxql(
    `DELETE FROM ${tabla} WHERE ${columna} = ${texto(idTramite)}`
  );
  for (const [indice, descripcion] of descripciones.entries()) {
    await ejecutarPraxql(
      `INSERT INTO ${tabla} (${columna}, Descripcion, Orden) ` +
        `VALUES (${texto(idTramite)}, ${texto(descripcion)}, ${literal(indice + 1)})`
    );
  }
}

/** Reemplaza los alias de una ficha. */
async function reemplazarAlias(
  idTramite: string,
  alias: string[]
): Promise<void> {
  await ejecutarPraxql(
    `DELETE FROM ${t.alias} WHERE Tramite = ${texto(idTramite)}`
  );
  for (const nombre of alias) {
    if (!nombre.trim()) continue;
    await ejecutarPraxql(
      `INSERT INTO ${t.alias} (Nombre, Tramite) VALUES (${texto(
        nombre.trim()
      )}, ${texto(idTramite)})`
    );
  }
}

export interface FichaAEscribir {
  id: string;
  tramite: string;
  requisitos: string[];
  pasos: string[];
  vigencia: string;
  alias: string[];
  enlace: string;
  soloEnlace: boolean;
}

async function escribirFicha(
  ficha: FichaAEscribir,
  modo: "crear" | "actualizar"
): Promise<void> {
  const campos: CamposTramite = {
    tramite: ficha.tramite,
    vigencia: ficha.vigencia,
    enlace: ficha.enlace,
    soloEnlace: ficha.soloEnlace,
  };

  if (modo === "crear") {
    await insertarTramite(ficha.id, campos);
  } else {
    await actualizarTramite(ficha.id, campos);
  }

  // Una ficha de catálogo nunca arrastra requisitos ni pasos (US-09).
  const id = await idInternoDe(ficha.id);
  if (!id) return;
  await reemplazarFilas(t.requisitos, "Tramite", id, ficha.requisitos);
  await reemplazarFilas(t.pasos, "Tramite", id, ficha.pasos);
  await reemplazarAlias(id, ficha.alias);
}

export function crearFichaEnPraxsuite(ficha: FichaAEscribir): Promise<void> {
  return escribirFicha(ficha, "crear");
}

export function actualizarFichaEnPraxsuite(
  ficha: FichaAEscribir
): Promise<void> {
  return escribirFicha(ficha, "actualizar");
}

export async function eliminarFichaEnPraxsuite(codigo: string): Promise<void> {
  const id = await idInternoDe(codigo);
  if (id) {
    await reemplazarFilas(t.requisitos, "Tramite", id, []);
    await reemplazarFilas(t.pasos, "Tramite", id, []);
    await reemplazarAlias(id, []);
  }
  await ejecutarPraxql(
    `DELETE FROM ${t.tramites} WHERE Codigo = ${texto(codigo)}`
  );
}
