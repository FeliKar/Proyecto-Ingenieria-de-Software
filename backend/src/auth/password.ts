import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

/**
 * Hash de contraseñas con scrypt (node:crypto).
 *
 * scrypt está en la librería estándar de Node: no agrega ninguna dependencia
 * nativa que haya que compilar. Cada hash guarda su propia sal aleatoria y el
 * parámetro de coste, así que se puede ajustar el coste sin romper las
 * contraseñas ya guardadas.
 *
 * Formato guardado: `scrypt$<coste>$<sal base64>$<hash base64>`.
 */

const PREFIJO = "scrypt";
const LARGO_SAL = 16;
const LARGO_HASH = 64;
// N del scrypt: 16384 es el valor por defecto de Node y tarda ~50 ms.
const COSTE = 16384;

/** Normaliza la contraseña para que "á" y "a con tilde" no cuenten distinto. */
function normalizar(password: string): string {
  return password.normalize("NFKC");
}

export function hashPassword(password: string): string {
  const sal = randomBytes(LARGO_SAL);
  const hash = scryptSync(normalizar(password), sal, LARGO_HASH, { N: COSTE });
  return [
    PREFIJO,
    String(COSTE),
    sal.toString("base64"),
    hash.toString("base64"),
  ].join("$");
}

/**
 * Compara en tiempo constante. Devuelve `false` (sin lanzar) ante cualquier
 * formato inválido, para que un hash corrupto no se confunda con un error.
 */
export function verificarPassword(
  password: string,
  almacenado: string
): boolean {
  const partes = almacenado.split("$");
  if (partes.length !== 4 || partes[0] !== PREFIJO) return false;

  const coste = Number(partes[1]);
  if (!Number.isInteger(coste) || coste < 2 || coste > 1 << 22) return false;

  let sal: Buffer;
  let esperado: Buffer;
  try {
    sal = Buffer.from(partes[2], "base64");
    esperado = Buffer.from(partes[3], "base64");
  } catch {
    return false;
  }
  if (sal.length === 0 || esperado.length === 0) return false;

  let obtenido: Buffer;
  try {
    obtenido = scryptSync(normalizar(password), sal, esperado.length, {
      N: coste,
    });
  } catch {
    return false;
  }
  return timingSafeEqual(obtenido, esperado);
}
