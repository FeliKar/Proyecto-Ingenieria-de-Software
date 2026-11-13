import { praxsuite } from "../config";
import fichasJson from "../data/fichas.json";
import catalogoJson from "../data/catalogo.json";
import type { FichaTramite } from "../types/ficha";
import {
  cargarCatalogo,
  cargarFichasValidas,
} from "./fichaValidator";

/**
 * Fuente de trámites.
 *
 * Orden de preferencia:
 *   1. Praxsuite (DataEngine del workspace MuniChatIA), si hay API key.
 *   2. Los JSON de `src/data`, como respaldo.
 *
 * El respaldo mantiene los tests herméticos: sin `PRAXSUITE_API_KEY` nunca se
 * hace una petición de red y el comportamiento es idéntico al anterior.
 */

export type OrigenFichas = "praxsuite" | "json";

type Fila = Record<string, unknown>;

const fichasValidas = cargarFichasValidas(fichasJson as FichaTramite[]);
const fichasLocales: FichaTramite[] = [
  ...fichasValidas,
  ...cargarCatalogo(catalogoJson, fichasValidas),
];

// ----------------------------- utilidades ----------------------------------

function texto(valor: unknown): string {
  return typeof valor === "string" ? valor : "";
}

/** `EnlaceOficial` puede llegar como objeto `{url, label}` o como su JSON serializado. */
function urlOficial(valor: unknown): string {
  if (typeof valor === "string") {
    const crudo = valor.trim();
    if (!crudo) return "";
    try {
      const objeto = JSON.parse(crudo) as { url?: unknown };
      if (objeto && typeof objeto.url === "string") return objeto.url;
    } catch {
      // No era JSON: se asume una URL plana.
    }
    return crudo;
  }
  if (valor && typeof valor === "object" && "url" in valor) {
    const url = (valor as { url?: unknown }).url;
    return typeof url === "string" ? url : "";
  }
  return "";
}

/** Las columnas de relación llegan como `[{ Id, Record }]` o como UUID suelto. */
function idsRelacion(valor: unknown): string[] {
  if (Array.isArray(valor)) {
    return valor
      .map((v) =>
        typeof v === "string" ? v : (v as { Id?: unknown } | null)?.Id
      )
      .filter((v): v is string => typeof v === "string" && v.length > 0);
  }
  if (typeof valor === "string") return [valor];
  if (valor && typeof valor === "object") {
    const id = (valor as { Id?: unknown }).Id;
    return typeof id === "string" ? [id] : [];
  }
  return [];
}

function orden(valor: unknown): number {
  const n = Number(valor);
  return Number.isFinite(n) ? n : 0;
}

// ------------------------------ Praxsuite -----------------------------------

async function consultarTabla(
  tableId: string,
  select: string[]
): Promise<Fila[]> {
  const limite = 200;
  const filas: Fila[] = [];

  for (let offset = 0; ; offset += limite) {
    const respuesta = await fetch(`${praxsuite.gatewayUrl}/query`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${praxsuite.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        refs: { t: tableId },
        query: { from: "t", select, limit: limite, offset },
      }),
    });

    if (!respuesta.ok) {
      const detalle = await respuesta.text().catch(() => "");
      throw new Error(
        `Praxsuite respondió ${respuesta.status}${detalle ? `: ${detalle.slice(0, 300)}` : ""}`
      );
    }

    const cuerpo = (await respuesta.json()) as { data?: Fila[] };
    const lote = cuerpo.data ?? [];
    filas.push(...lote);
    if (lote.length < limite) break;
  }

  return filas;
}

function agruparPorTramite(
  filas: Fila[],
  columnaTexto: string
): Map<string, string[]> {
  const mapa = new Map<string, string[]>();
  const ordenadas = [...filas].sort((a, b) => orden(a.Orden) - orden(b.Orden));
  for (const fila of ordenadas) {
    const descripcion = texto(fila[columnaTexto]);
    if (!descripcion) continue;
    for (const id of idsRelacion(fila.Tramite)) {
      const actual = mapa.get(id) ?? [];
      actual.push(descripcion);
      mapa.set(id, actual);
    }
  }
  return mapa;
}

/** Agrupa los alias por trámite (relación `Alias.Tramite`). */
function agruparAlias(filas: Fila[]): Map<string, string[]> {
  const mapa = new Map<string, string[]>();
  for (const fila of filas) {
    const alias = texto(fila.Nombre).trim();
    if (!alias) continue;
    for (const id of idsRelacion(fila.Tramite)) {
      const actual = mapa.get(id) ?? [];
      if (!actual.includes(alias)) actual.push(alias);
      mapa.set(id, actual);
    }
  }
  return mapa;
}

/** Traduce `TramiteClase` a las clases (A, B, …) de cada trámite. */
function agruparClases(
  filas: Fila[],
  clasePorId: Map<string, string>
): Map<string, string[]> {
  const mapa = new Map<string, string[]>();

  for (const fila of filas) {
    const referencia = Array.isArray(fila.Clase) ? fila.Clase[0] : fila.Clase;
    const idClase =
      typeof referencia === "string"
        ? referencia
        : (referencia as { Id?: unknown } | null | undefined)?.Id;
    const clase =
      (typeof idClase === "string" ? clasePorId.get(idClase) : undefined) ??
      (referencia as { Record?: unknown } | null | undefined)?.Record;

    if (typeof clase !== "string" || clase.trim().length === 0) continue;

    for (const id of idsRelacion(fila.Tramite)) {
      const actual = mapa.get(id) ?? [];
      if (!actual.includes(clase)) actual.push(clase);
      mapa.set(id, actual);
    }
  }

  for (const clases of mapa.values()) clases.sort();
  return mapa;
}

async function cargarDesdePraxsuite(): Promise<FichaTramite[]> {
  const [tramites, alias, clases, tramiteClase, requisitos, pasos] =
    await Promise.all([
      consultarTabla(praxsuite.tablas.tramites, [
        "ID",
        "POSITION",
        "Codigo",
        "Nombre",
        "Vigencia",
        "EnlaceOficial",
        "Solo_Enlace",
      ]),
      consultarTabla(praxsuite.tablas.alias, ["Nombre", "Tramite"]),
      consultarTabla(praxsuite.tablas.clases, ["ID", "Clase"]),
      consultarTabla(praxsuite.tablas.tramiteClase, ["Tramite", "Clase"]),
      consultarTabla(praxsuite.tablas.requisitos, [
        "Tramite",
        "Descripcion",
        "Orden",
      ]),
      consultarTabla(praxsuite.tablas.pasos, [
        "Tramite",
        "Descripcion",
        "Orden",
      ]),
    ]);

  if (tramites.length === 0) {
    throw new Error("Praxsuite devolvió 0 trámites.");
  }

  const clasePorId = new Map(
    clases
      .map((fila) => [texto(fila.ID), texto(fila.Clase)] as const)
      .filter(([id, clase]) => id.length > 0 && clase.length > 0)
  );
  const aliasPorTramite = agruparAlias(alias);
  const clasesPorTramite = agruparClases(tramiteClase, clasePorId);
  const requisitosPorTramite = agruparPorTramite(requisitos, "Descripcion");
  const pasosPorTramite = agruparPorTramite(pasos, "Descripcion");

  const completas: FichaTramite[] = [];
  const catalogo: FichaTramite[] = [];
  let descartados = 0;

  const ordenadas = [...tramites].sort(
    (a, b) => orden(a.POSITION) - orden(b.POSITION)
  );

  for (const fila of ordenadas) {
    const id = texto(fila.Codigo).trim();
    const tramite = texto(fila.Nombre).trim();
    const enlace = urlOficial(fila.EnlaceOficial);
    const idInterno = texto(fila.ID);

    if (!id || !tramite || !enlace.startsWith("https://")) {
      descartados += 1;
      console.warn(
        `Praxsuite: trámite '${tramite || idInterno || "?"}' descartado (código, nombre o enlace inválido).`
      );
      continue;
    }

    const aliasTramite = aliasPorTramite.get(idInterno) ?? [];
    const clase = (clasesPorTramite.get(idInterno) ?? []).join(",");

    const base: FichaTramite = {
      id,
      tramite,
      requisitos: requisitosPorTramite.get(idInterno) ?? [],
      pasos: pasosPorTramite.get(idInterno) ?? [],
      vigencia: texto(fila.Vigencia),
      alias: aliasTramite.length > 0 ? aliasTramite : [tramite],
      enlace_oficial: enlace,
      ...(clase ? { clase } : {}),
    };

    if (fila.Solo_Enlace === true) {
      // Un trámite de catálogo nunca arrastra requisitos ni pasos inventados.
      catalogo.push({
        ...base,
        requisitos: [],
        pasos: [],
        vigencia: "",
        solo_enlace: true,
      });
    } else {
      completas.push(base);
    }
  }

  if (descartados > 0) {
    console.warn(`Praxsuite: ${descartados} trámite(s) descartado(s).`);
  }

  const resultado = [...cargarFichasValidas(completas), ...catalogo];
  if (resultado.length === 0) {
    throw new Error("Praxsuite no devolvió trámites utilizables.");
  }
  return resultado;
}

// -------------------------------- caché ------------------------------------

interface Cache {
  at: number;
  fichas: FichaTramite[];
  origen: OrigenFichas;
}

let cache: Cache | null = null;
let enCurso: Promise<Cache> | null = null;

async function resolver(): Promise<Cache> {
  if (!praxsuite.habilitado) {
    return { at: Date.now(), fichas: fichasLocales, origen: "json" };
  }

  try {
    const fichas = await cargarDesdePraxsuite();
    return { at: Date.now(), fichas, origen: "praxsuite" };
  } catch (error) {
    console.warn(
      `Praxsuite no disponible, se usan los JSON locales: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
    return { at: Date.now(), fichas: fichasLocales, origen: "json" };
  }
}

/**
 * Devuelve los trámites consultables. El resultado se cachea para no consultar
 * el gateway en cada petición.
 */
export async function obtenerFichas(): Promise<FichaTramite[]> {
  if (cache && Date.now() - cache.at < praxsuite.cacheTtlMs) {
    return cache.fichas;
  }

  if (!enCurso) {
    enCurso = resolver()
      .then((resultado) => {
        if (!cache || cache.origen !== resultado.origen) {
          console.log(
            `Trámites cargados desde ${resultado.origen} (${resultado.fichas.length}).`
          );
        }
        cache = resultado;
        return resultado;
      })
      .finally(() => {
        enCurso = null;
      });
  }

  return (await enCurso).fichas;
}

/** Estado de la fuente, útil para diagnóstico. */
export async function estadoFuente(): Promise<{
  origen: OrigenFichas;
  total: number;
  fichas: number;
  catalogo: number;
}> {
  const fichas = await obtenerFichas();
  return {
    origen: cache?.origen ?? "json",
    total: fichas.length,
    fichas: fichas.filter((f) => !f.solo_enlace).length,
    catalogo: fichas.filter((f) => f.solo_enlace).length,
  };
}
