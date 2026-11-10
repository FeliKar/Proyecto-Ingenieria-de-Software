import fichas from "../data/fichas.json";
import catalogo from "../data/catalogo.json";
import type { FichaTramite } from "../types/ficha";
import { matchTramiteDetalle } from "./tramiteMatcher";
import { cargarCatalogo, cargarFichasValidas } from "./fichaValidator";
import {
  ABSTENCION_MENSAJE,
  CANAL_DERIVACION,
  MENSAJE_AMBIGUO,
  MENSAJE_EMPATE,
  mensajeAmbiguoClase,
} from "../constants/abstention";

// Respuesta estándar de una ficha, marcando si es de solo enlace.
export function fichaEnRespuesta(ficha: FichaTramite) {
  return {
    id: ficha.id,
    tramite: ficha.tramite,
    requisitos: ficha.requisitos,
    pasos: ficha.pasos,
    vigencia: ficha.vigencia,
    enlace_oficial: ficha.enlace_oficial,
    ...(ficha.solo_enlace ? { solo_enlace: true } : {}),
  };
}

/**
 * Lógica de negocio de "Consultar trámite": decide si hay ficha, si la
 * consulta es ambigua o si el asistente se abstiene. No sabe nada de HTTP;
 * la ruta solo traduce lo que devuelve a una respuesta.
 */
export class TramiteService {
  constructor(private readonly fichasDisponibles: FichaTramite[]) {}

  // Solo las fichas válidas responden: una ficha sin enlace oficial se rechaza
  // y nunca se sustituye por una URL inventada. El catálogo trae solo nombre y
  // enlace; sus duplicados de las fichas completas se descartan en la carga.
  static desdeDatos(): TramiteService {
    const fichasValidas = cargarFichasValidas(fichas as FichaTramite[]);
    const fichasCatalogo = cargarCatalogo(catalogo, fichasValidas);
    return new TramiteService([...fichasValidas, ...fichasCatalogo]);
  }

  buscarPorId(id: string) {
    const ficha = this.fichasDisponibles.find((f) => f.id === id);
    return ficha ? fichaEnRespuesta(ficha) : null;
  }

  consultar(pregunta: string) {
    const { ficha, motivo, clase, opciones } = matchTramiteDetalle(
      pregunta,
      this.fichasDisponibles
    );

    if (ficha) {
      return { encontrado: true as const, ficha: fichaEnRespuesta(ficha) };
    }

    return {
      encontrado: false as const,
      abstencion: true as const,
      motivo,
      mensaje: mensajeSinFicha(motivo, clase),
      canal_derivacion: CANAL_DERIVACION,
      ...(opciones ? { opciones } : {}),
    };
  }
}

function mensajeSinFicha(motivo: string, clase?: string): string {
  if (motivo === "ambiguo") {
    return clase ? mensajeAmbiguoClase(clase) : MENSAJE_AMBIGUO;
  }
  if (motivo === "empate") return MENSAJE_EMPATE;
  return ABSTENCION_MENSAJE;
}
