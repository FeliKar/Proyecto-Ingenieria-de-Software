import type { FichaTramite } from "../types/ficha";

/**
 * Validación de fichas de trámites (T15 / T18).
 *
 * La fuente de verdad (`fichas.json`) debe entregar siempre un enlace oficial
 * válido. Si una ficha no lo trae, se rechaza en la carga: nunca se reemplaza
 * por una URL construida dinámicamente.
 */

export function esEnlaceOficialValido(enlace: unknown): enlace is string {
  return (
    typeof enlace === "string" &&
    enlace.trim().length > 0 &&
    enlace.startsWith("https://")
  );
}

/**
 * Devuelve el motivo por el que una ficha es inválida, o `null` si es válida.
 */
export function motivoFichaInvalida(
  ficha: Partial<FichaTramite>
): string | null {
  if (typeof ficha.id !== "string" || ficha.id.trim().length === 0) {
    return "id vacío";
  }
  if (typeof ficha.tramite !== "string" || ficha.tramite.trim().length === 0) {
    return "trámite vacío";
  }
  if (!Array.isArray(ficha.requisitos) || ficha.requisitos.length === 0) {
    return "requisitos vacíos";
  }
  if (!Array.isArray(ficha.pasos) || ficha.pasos.length === 0) {
    return "pasos vacíos";
  }
  if (typeof ficha.vigencia !== "string" || ficha.vigencia.trim().length === 0) {
    return "vigencia vacía";
  }
  if (!Array.isArray(ficha.alias) || ficha.alias.length === 0) {
    return "alias vacíos";
  }
  if (!esEnlaceOficialValido(ficha.enlace_oficial)) {
    return "enlace_oficial ausente o inválido (debe comenzar con https://)";
  }
  return null;
}

/**
 * Rechaza (descarta) las fichas inválidas para que no puedan responder
 * consultas. No genera ni sustituye enlaces.
 */
export function cargarFichasValidas(
  fichas: ReadonlyArray<Partial<FichaTramite>>
): FichaTramite[] {
  const validas: FichaTramite[] = [];
  for (const ficha of fichas) {
    const motivo = motivoFichaInvalida(ficha);
    if (motivo) {
      console.warn(`Ficha '${ficha.id ?? "?"}' rechazada: ${motivo}`);
      continue;
    }
    validas.push(ficha as FichaTramite);
  }
  return validas;
}
