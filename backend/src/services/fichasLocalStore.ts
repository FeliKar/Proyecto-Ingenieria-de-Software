import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import catalogoBase from "../data/catalogo.json";
import fichasBase from "../data/fichas.json";
import { panel } from "../config";
import type { FichaTramite } from "../types/ficha";
import type { EntradaCatalogo } from "./fichaValidator";

/**
 * Almacenamiento local de fichas (fuente `json` del panel, US-05).
 *
 * Lee y escribe `fichas.json` y `catalogo.json` en disco. Si el archivo no
 * existe, se usa el contenido incluido en el repositorio: el comportamiento
 * por defecto sigue siendo idéntico al anterior.
 *
 * Las rutas se pueden sobrescribir (`FICHAS_JSON_RUTA`, `CATALOGO_JSON_RUTA`)
 * para que los tests escriban en un directorio temporal y nunca toquen los
 * datos reales del repositorio.
 */

function leerJson<T>(ruta: string, respaldo: T): T {
  if (!existsSync(ruta)) return respaldo;
  try {
    return JSON.parse(readFileSync(ruta, "utf8")) as T;
  } catch (error) {
    console.warn(
      `No se pudo leer '${ruta}': ${
        error instanceof Error ? error.message : String(error)
      }. Se usa el contenido incluido en el repositorio.`
    );
    return respaldo;
  }
}

function escribirJson(ruta: string, contenido: string): void {
  mkdirSync(dirname(ruta), { recursive: true });
  writeFileSync(ruta, contenido, "utf8");
}

export function leerFichasCompletas(
  ruta: string = panel.fichasJson
): FichaTramite[] {
  const crudo = leerJson<FichaTramite[]>(ruta, fichasBase as FichaTramite[]);
  return Array.isArray(crudo) ? crudo : (fichasBase as FichaTramite[]);
}

export function leerCatalogo(
  ruta: string = panel.catalogoJson
): EntradaCatalogo[] {
  const crudo = leerJson<EntradaCatalogo[]>(ruta, catalogoBase as EntradaCatalogo[]);
  return Array.isArray(crudo) ? crudo : (catalogoBase as EntradaCatalogo[]);
}

export function guardarFichasCompletas(
  fichas: FichaTramite[],
  ruta: string = panel.fichasJson
): void {
  escribirJson(ruta, `${JSON.stringify(fichas, null, 2)}\n`);
}

/** El catálogo guarda solo nombre y enlace: una línea por trámite. */
export function guardarCatalogo(
  registros: EntradaCatalogo[],
  ruta: string = panel.catalogoJson
): void {
  const lineas = registros.map((registro) => `  ${JSON.stringify(registro)}`);
  escribirJson(ruta, `[\n${lineas.join(",\n")}\n]\n`);
}
