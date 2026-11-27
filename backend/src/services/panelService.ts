import type { FichaTramite } from "../types/ficha";
import {
  motivoFichaInvalida,
  type EntradaCatalogo,
} from "./fichaValidator";
import {
  guardarCatalogo,
  guardarFichasCompletas,
  leerCatalogo,
  leerFichasCompletas,
} from "./fichasLocalStore";
import {
  actualizarFichaEnPraxsuite,
  crearFichaEnPraxsuite,
  eliminarFichaEnPraxsuite,
} from "./praxsuiteEscritura";
import {
  invalidarCache,
  obtenerFichas,
  origenActivo,
  type OrigenFichas,
} from "./tramitesRepository";

/**
 * Panel de funcionarios (US-05): alta, edición y baja de fichas.
 *
 * Escribe siempre en la fuente que está respondiendo ahora: si el backend está
 * leyendo Praxsuite, escribe en Praxsuite; si está usando los JSON locales,
 * escribe en los JSON locales. Después invalida la caché para que la consulta
 * del vecino refleje el cambio en el mismo segundo.
 *
 * Las reglas de US-09 no cambian: toda ficha necesita un enlace oficial
 * https y una ficha de catálogo nunca lleva requisitos, pasos ni vigencia.
 */

export class ErrorPanel extends Error {
  constructor(
    readonly status: number,
    mensaje: string
  ) {
    super(mensaje);
  }
}

export type TipoFicha = "completa" | "catalogo";

export interface EntradaPanel {
  id?: string;
  tramite: string;
  tipo?: TipoFicha;
  requisitos?: string[];
  pasos?: string[];
  vigencia?: string;
  alias?: string[];
  enlace_oficial: string;
  clase?: string;
}

export interface FichaPanel extends FichaTramite {
  tipo: TipoFicha;
}

function texto(valor: unknown): string {
  return typeof valor === "string" ? valor.trim() : "";
}

function lista(valor: unknown): string[] {
  if (!Array.isArray(valor)) return [];
  return valor
    .map((v) => (typeof v === "string" ? v.trim() : ""))
    .filter((v) => v.length > 0);
}

function slug(desde: string): string {
  return desde
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function aPanel(ficha: FichaTramite): FichaPanel {
  return {
    ...ficha,
    tipo: ficha.solo_enlace ? "catalogo" : "completa",
  };
}

/** Lista del panel: lo mismo que ve el vecino, lista para editar. */
export async function listarFichas(): Promise<{
  origen: OrigenFichas;
  tramites: FichaPanel[];
}> {
  const fichas = await obtenerFichas();
  const origen = origenActivo();
  const tramites = fichas
    .map(aPanel)
    .sort((a, b) => a.tramite.localeCompare(b.tramite, "es"));
  return { origen, tramites };
}

/**
 * Valida la entrada y devuelve la lista a guardar según el tipo.
 * Lanza `ErrorPanel` con el mensaje en lenguaje simple.
 */
function validar(entrada: EntradaPanel, id: string): {
  tipo: TipoFicha;
  ficha: FichaTramite;
} {
  const tramite = texto(entrada.tramite);
  const enlace = texto(entrada.enlace_oficial);

  if (!tramite) {
    throw new ErrorPanel(400, "El nombre del trámite no puede estar vacío.");
  }
  if (!enlace.startsWith("https://")) {
    throw new ErrorPanel(
      400,
      "El enlace oficial debe comenzar con https:// (US-09: nunca se inventa un enlace)."
    );
  }

  const tipo: TipoFicha = entrada.tipo ?? "completa";

  if (tipo === "catalogo") {
    if (
      lista(entrada.requisitos).length > 0 ||
      lista(entrada.pasos).length > 0 ||
      texto(entrada.vigencia).length > 0
    ) {
      throw new ErrorPanel(
        400,
        "Un trámite del catálogo solo tiene nombre y enlace: no se le pueden agregar requisitos, pasos ni vigencia (US-09)."
      );
    }
    return {
      tipo,
      ficha: {
        id,
        tramite,
        alias: [tramite],
        requisitos: [],
        pasos: [],
        vigencia: "",
        enlace_oficial: enlace,
        ...(texto(entrada.clase) ? { clase: texto(entrada.clase) } : {}),
        solo_enlace: true,
      },
    };
  }

  const alias = lista(entrada.alias);
  const candidata: FichaTramite = {
    id,
    tramite,
    requisitos: lista(entrada.requisitos),
    pasos: lista(entrada.pasos),
    vigencia: texto(entrada.vigencia),
    alias: alias.length > 0 ? alias : [tramite],
    enlace_oficial: enlace,
    ...(texto(entrada.clase) ? { clase: texto(entrada.clase) } : {}),
  };

  // Reutiliza la misma validación que usa la carga de datos: una ficha
  // incompleta no puede quedar guardada para responder consultas.
  const motivo = motivoFichaInvalida(candidata);
  if (motivo) {
    throw new ErrorPanel(
      400,
      `La ficha no se puede guardar: ${motivo}. Completa nombre, requisitos, pasos, vigencia y enlace oficial.`
    );
  }
  return { tipo, ficha: candidata };
}

// --------------------------- persistencia local ----------------------------

async function persistirLocal(
  operacion: (completas: FichaTramite[], catalogo: EntradaCatalogo[]) => void
): Promise<void> {
  const completas = leerFichasCompletas();
  const catalogo = leerCatalogo();
  operacion(completas, catalogo);
  guardarFichasCompletas(completas);
  guardarCatalogo(catalogo);
  invalidarCache();
}

async function escribirLocal(
  modo: "crear" | "actualizar" | "eliminar",
  ficha: FichaTramite,
  tipo: TipoFicha
): Promise<void> {
  await persistirLocal((completas, catalogo) => {
    if (tipo === "completa") {
      const indice = completas.findIndex((f) => f.id === ficha.id);
      if (modo === "eliminar") {
        if (indice < 0) throw new ErrorPanel(404, "No existe ese trámite.");
        completas.splice(indice, 1);
        return;
      }
      if (indice < 0) completas.push(ficha);
      else completas[indice] = ficha;
      return;
    }

    const indice = catalogo.findIndex(
      (e) => String(e.enlace_oficial) === ficha.enlace_oficial
    );
    if (modo === "eliminar") {
      if (indice < 0) throw new ErrorPanel(404, "No existe ese trámite.");
      catalogo.splice(indice, 1);
      return;
    }
    const entrada: EntradaCatalogo = {
      tramite: ficha.tramite,
      enlace_oficial: ficha.enlace_oficial,
    };
    if (indice < 0) catalogo.push(entrada);
    else catalogo[indice] = entrada;
  });
}

// ------------------------------- operaciones -------------------------------

async function escribirEnFuente(
  modo: "crear" | "actualizar" | "eliminar",
  ficha: FichaTramite,
  tipo: TipoFicha
): Promise<void> {
  await obtenerFichas(); // deja el origen conocido antes de decidir dónde escribir

  if (origenActivo() === "praxsuite") {
    const payload = {
      id: ficha.id,
      tramite: ficha.tramite,
      requisitos: ficha.requisitos,
      pasos: ficha.pasos,
      vigencia: ficha.vigencia,
      alias: ficha.alias,
      enlace: ficha.enlace_oficial,
      soloEnlace: tipo === "catalogo",
    };
    try {
      if (modo === "crear") await crearFichaEnPraxsuite(payload);
      else if (modo === "actualizar") await actualizarFichaEnPraxsuite(payload);
      else await eliminarFichaEnPraxsuite(ficha.id);
    } catch (error) {
      throw new ErrorPanel(
        502,
        `No se pudo guardar en Praxsuite: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
    invalidarCache();
    return;
  }

  await escribirLocal(modo, ficha, tipo);
}

async function existeId(id: string): Promise<boolean> {
  return (await obtenerFichas()).some((f) => f.id === id && !f.solo_enlace);
}

export async function crearFicha(entrada: EntradaPanel): Promise<FichaTramite> {
  const tipo = entrada.tipo ?? "completa";
  const id =
    tipo === "completa"
      ? texto(entrada.id) || slug(texto(entrada.tramite))
      : slug(texto(entrada.tramite));

  if (!id) {
    throw new ErrorPanel(400, "No se pudo generar un identificador válido.");
  }
  if (tipo === "completa" && (await existeId(id))) {
    throw new ErrorPanel(409, `Ya existe una ficha con el id '${id}'.`);
  }

  const { ficha } = validar(entrada, id);

  if (tipo === "catalogo") {
    const existente = (await obtenerFichas()).find(
      (f) => f.enlace_oficial === ficha.enlace_oficial
    );
    if (existente) {
      throw new ErrorPanel(
        409,
        `Ya existe un trámite con ese enlace oficial: '${existente.tramite}'.`
      );
    }
  }

  await escribirEnFuente("crear", ficha, tipo);
  return ficha;
}

export async function actualizarFicha(
  id: string,
  entrada: EntradaPanel
): Promise<FichaTramite> {
  const existente = (await obtenerFichas()).find((f) => f.id === id);
  if (!existente) {
    throw new ErrorPanel(404, "No existe un trámite con ese identificador.");
  }
  const tipo: TipoFicha = existente.solo_enlace ? "catalogo" : "completa";
  if (entrada.tipo && entrada.tipo !== tipo) {
    throw new ErrorPanel(
      400,
      tipo === "catalogo"
        ? "Este trámite es del catálogo: solo puede tener nombre y enlace."
        : "Este trámite ya tiene ficha completa: no se puede convertir en catálogo desde el panel."
    );
  }

  const { ficha } = validar({ ...entrada, tipo }, id);
  await escribirEnFuente("actualizar", ficha, tipo);
  return ficha;
}

export async function eliminarFicha(id: string): Promise<void> {
  const existente = (await obtenerFichas()).find((f) => f.id === id);
  if (!existente) {
    throw new ErrorPanel(404, "No existe un trámite con ese identificador.");
  }
  const tipo: TipoFicha = existente.solo_enlace ? "catalogo" : "completa";
  await escribirEnFuente("eliminar", existente, tipo);
}
