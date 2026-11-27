import { copyFileSync, existsSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

/**
 * Entorno de los tests unitarios del panel (US-05).
 *
 * Se debe importar ANTES que cualquier módulo de `src`: fija las rutas de los
 * JSON hacia un directorio temporal para que las pruebas de alta, edición y
 * baja no toquen los datos reales del repositorio.
 */

// npm corre con cwd = backend (npm --prefix backend run test:unit).
const datos = existsSync(resolve(process.cwd(), "src/data"))
  ? resolve(process.cwd(), "src/data")
  : resolve(process.cwd(), "backend/src/data");

const temporal = mkdtempSync(join(tmpdir(), "munichat-panel-"));

export const rutasTest = {
  fichas: join(temporal, "fichas.json"),
  catalogo: join(temporal, "catalogo.json"),
  usuarios: join(temporal, "usuarios.json"),
};

copyFileSync(resolve(datos, "fichas.json"), rutasTest.fichas);
copyFileSync(resolve(datos, "catalogo.json"), rutasTest.catalogo);
copyFileSync(resolve(datos, "usuarios.json"), rutasTest.usuarios);

process.env.PRAXSUITE_DISABLED = "1";
process.env.FICHAS_JSON_RUTA = rutasTest.fichas;
process.env.CATALOGO_JSON_RUTA = rutasTest.catalogo;
process.env.USUARIOS_JSON_RUTA = rutasTest.usuarios;
