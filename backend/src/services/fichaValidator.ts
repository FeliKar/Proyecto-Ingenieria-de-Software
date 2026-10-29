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

// --- Catálogo de trámites (solo nombre + enlace oficial) -------------------

export interface EntradaCatalogo {
  tramite?: unknown;
  enlace_oficial?: unknown;
}

/**
 * Enlaces ya cubiertos por una ficha completa o que entrarían en conflicto con
 * la desambigüedad del alcance del Sprint 1 (primera vez vs renovación).
 */
const EXCLUSIONES_CATALOGO = new Set([
  "https://tramites.penalolen.cl/Tramites/ver/renovacion-online-de-licencia-de-b-c-d-f",
]);

function idDesdeEnlace(enlace: string): string {
  const ultima = enlace.split(/[?#]/)[0].split("/").filter(Boolean).pop() ?? "";
  return ultima
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Construye las fichas del catálogo oficial a partir de nombre y enlace.
 *
 * - Valida nombre y enlace https con el mismo criterio estricto de las fichas.
 * - Omite los que repiten el enlace de una ficha completa (duplicados).
 * - NO inventa requisitos, pasos ni vigencia: son fichas `solo_enlace`.
 */
export function cargarCatalogo(
  registros: ReadonlyArray<EntradaCatalogo>,
  existentes: ReadonlyArray<FichaTramite>
): FichaTramite[] {
  const urlsCubiertas = new Set(existentes.map((f) => f.enlace_oficial));
  const idsVistos = new Set<string>();
  const catalogo: FichaTramite[] = [];

  registros.forEach((entrada, indice) => {
    const etiqueta =
      typeof entrada?.tramite === "string" && entrada.tramite.trim().length > 0
        ? entrada.tramite.trim()
        : `#${indice}`;

    if (
      typeof entrada?.tramite !== "string" ||
      entrada.tramite.trim().length === 0
    ) {
      console.warn(`Catálogo: '${etiqueta}' descartado: nombre vacío.`);
      return;
    }
    const nombre = entrada.tramite.trim();

    if (!esEnlaceOficialValido(entrada.enlace_oficial)) {
      console.warn(
        `Catálogo: '${etiqueta}' descartado: enlace oficial ausente o inválido (debe comenzar con https://).`
      );
      return;
    }
    const url = entrada.enlace_oficial.trim();

    if (EXCLUSIONES_CATALOGO.has(url) || urlsCubiertas.has(url)) {
      console.warn(
        `Catálogo: '${etiqueta}' descartado: su enlace ya está cubierto por una ficha existente.`
      );
      return;
    }

    const id = idDesdeEnlace(url);
    if (id.length === 0 || idsVistos.has(id)) {
      console.warn(`Catálogo: '${etiqueta}' descartado: id derivado vacío o duplicado.`);
      return;
    }

    idsVistos.add(id);
    urlsCubiertas.add(url);
    catalogo.push({
      id,
      tramite: nombre,
      alias: [nombre],
      requisitos: [],
      pasos: [],
      vigencia: "",
      enlace_oficial: url,
      solo_enlace: true,
    });
  });

  return catalogo;
}
