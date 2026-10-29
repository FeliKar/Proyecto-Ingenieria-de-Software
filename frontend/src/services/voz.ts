import type { FichaTramite } from "../types/tramite";

// Lectura en voz alta de las respuestas (Web Speech API - speechSynthesis).
// Pensada para quien no sabe leer: escucha requisitos, pasos y vigencia.

export function lecturaDisponible(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

const IDIOMA_VOZ = "es-CL";
const VELOCIDAD = 0.95; // Un poco más lenta para facilitar la comprensión.

export function leer(texto: string): void {
  if (!lecturaDisponible() || !texto.trim()) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(texto);
  utterance.lang = IDIOMA_VOZ;
  utterance.rate = VELOCIDAD;
  const vozEspañol = window.speechSynthesis
    .getVoices()
    .find((v) => v.lang.toLowerCase().startsWith("es"));
  if (vozEspañol) utterance.voice = vozEspañol;
  window.speechSynthesis.speak(utterance);
}

export function detenerLectura(): void {
  if (!lecturaDisponible()) return;
  window.speechSynthesis.cancel();
}

// --- Diagnóstico del entorno ---------------------------------------------

export interface EntornoVoz {
  reconocimientoSoportado: boolean;
  contextoSeguro: boolean;
  esLocalhost: boolean;
}

// ¿Hay SpeechRecognition en este navegador?
export function reconocimientoDisponible(): boolean {
  if (typeof window === "undefined") return false;
  const nav = window as unknown as {
    SpeechRecognition?: unknown;
    webkitSpeechRecognition?: unknown;
  };
  return Boolean(nav.SpeechRecognition ?? nav.webkitSpeechRecognition);
}

// El navegador solo permite el micrófono y el reconocimiento de voz en
// contextos seguros (https) fuera de localhost.
export function diagnosticarEntornoVoz(): EntornoVoz {
  if (typeof window === "undefined") {
    // Sin ventana (pruebas/render en servidor): entorno neutro, sin avisos.
    return { reconocimientoSoportado: false, contextoSeguro: true, esLocalhost: true };
  }
  const host = window.location.hostname;
  return {
    reconocimientoSoportado: reconocimientoDisponible(),
    contextoSeguro: window.isSecureContext,
    esLocalhost: host === "localhost" || host === "127.0.0.1" || host === "[::1]",
  };
}

// Aviso permanente cuando el entorno impide usar la voz (se muestra junto al botón).
export function avisoEntornoVoz(entorno: EntornoVoz): string | null {
  if (!entorno.reconocimientoSoportado) {
    return "Este navegador no reconoce voz. Usa Chrome o Microsoft Edge, o escribe tu consulta aquí abajo.";
  }
  if (!entorno.contextoSeguro && !entorno.esLocalhost) {
    return "El navegador bloquea el micrófono porque esta página no está en https. Abre la dirección con https o escribe tu consulta.";
  }
  return null;
}

// Mensajes en lenguaje simple según el error que devuelve el navegador.
export function mensajeErrorVoz(
  error: string | null,
  entorno: EntornoVoz = diagnosticarEntornoVoz()
): string | null {
  if (!error) return null;

  // Si la página no es un contexto seguro, el problema no es de internet:
  // el navegador impide usar el micrófono.
  if (!entorno.contextoSeguro && !entorno.esLocalhost) {
    return "El navegador bloquea el micrófono porque esta página no está en https. Abre la dirección con https o escribe tu consulta.";
  }

  const mensajes: Record<string, string> = {
    "not-allowed":
      "No tengo permiso para usar el micrófono. Permite el micrófono en el navegador y vuelve a intentar.",
    "service-not-allowed":
      "El micrófono está bloqueado. Permite el micrófono en el navegador y vuelve a intentar.",
    "audio-capture": "No encuentro el micrófono de este dispositivo.",
    network:
      "No pude contactar el servicio de reconocimiento de voz del navegador. Puede ser la conexión, un bloqueador de anuncios o que esta red lo bloquea. Prueba con Microsoft Edge, o escribe tu consulta.",
    "no-speech": "No te escuché. Toca el micrófono y habla más cerca de él.",
  };

  return (
    mensajes[error] ?? "Algo salió mal con el micrófono. Tócalo para intentar de nuevo."
  );
}

function listaHablada(items: string[]): string {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  const ultimo = items[items.length - 1];
  const resto = items.slice(0, -1).join(". ");
  return `${resto}. Y ${ultimo}`;
}

export function textoFicha(ficha: FichaTramite): string {
  const partes = [`Encontré este trámite: ${ficha.tramite}.`];

  const requisitos = listaHablada(ficha.requisitos);
  if (requisitos) partes.push(`Requisitos. ${requisitos}`);

  const pasos = listaHablada(ficha.pasos);
  if (pasos) partes.push(`Pasos a seguir. ${pasos}`);

  if (ficha.vigencia) partes.push(`Vigencia. ${ficha.vigencia}`);

  if (ficha.enlace_oficial) {
    partes.push("Te dejé el enlace oficial en la pantalla.");
  }

  return partes.join(" ");
}

export function textoAbstencion(
  mensaje: string,
  opciones?: { id: string; tramite: string }[]
): string {
  const partes = [mensaje];

  if (opciones && opciones.length > 0) {
    const nombres = opciones.map((o) => o.tramite);
    partes.push(
      `Puedes tocar una de estas opciones en la pantalla: ${listaHablada(nombres)}.`
    );
  } else {
    partes.push("Toca el botón azul de la pantalla para ir al canal oficial.");
  }

  return partes.join(" ");
}

export function textoConfirmacion(transcripcion: string): string {
  return `Escuché lo siguiente: ${transcripcion}. ¿Es correcto? Toca buscar si está bien, o habla otra vez si me equivoqué.`;
}

export const MENSAJE_ERROR_VOZ =
  "No pude buscar en este momento. Toca el micrófono para intentarlo de nuevo.";
