import { copyFileSync, existsSync, mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

/**
 * Aísla los tests de la red y del repositorio.
 *
 * 1. Fija PRAXSUITE_DISABLED=1 antes de importar la app: la suite nunca
 *    depende del gateway ni de credenciales.
 * 2. Copia fichas.json, catalogo.json y usuarios.json a un directorio
 *    temporal: los escenarios del panel (US-05) pueden crear, editar y borrar
 *    sin dejar rastro en los datos reales.
 *
 * Este módulo debe cargarse antes que los step definitions (ver cucumber.js).
 * Los hooks que restauran el estado viven en `step-definitions/hooks.ts`.
 */
process.env.PRAXSUITE_DISABLED = "1";

// Cucumber corre con cwd = backend (npm --prefix backend test).
const datos = existsSync(resolve(process.cwd(), "src/data"))
  ? resolve(process.cwd(), "src/data")
  : resolve(process.cwd(), "backend/src/data");
const temporal = mkdtempSync(join(tmpdir(), "munichat-test-"));

export const rutasTest = {
  fichas: join(temporal, "fichas.json"),
  catalogo: join(temporal, "catalogo.json"),
  usuarios: join(temporal, "usuarios.json"),
};

/** Copias de trabajo + contenido original de cada archivo. */
export const respaldos = new Map<string, string>();

for (const [origen, destino] of [
  [resolve(datos, "fichas.json"), rutasTest.fichas],
  [resolve(datos, "catalogo.json"), rutasTest.catalogo],
  [resolve(datos, "usuarios.json"), rutasTest.usuarios],
] as const) {
  copyFileSync(origen, destino);
  respaldos.set(destino, readFileSync(origen, "utf8"));
}

process.env.FICHAS_JSON_RUTA = rutasTest.fichas;
process.env.CATALOGO_JSON_RUTA = rutasTest.catalogo;
process.env.USUARIOS_JSON_RUTA = rutasTest.usuarios;
