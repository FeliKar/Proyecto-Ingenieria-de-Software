export const ABSTENCION_MENSAJE =
  "No encontré información suficiente para responder tu consulta con confianza. Para evitar entregar datos incorrectos, te derivo al canal oficial.";

export const MENSAJE_AMBIGUO =
  "Encontré varios trámites que podrían ser lo que buscas. ¿Lo necesitas por primera vez o quieres renovar el trámite? Elige una de las opciones.";

export const MENSAJE_EMPATE =
  "Encontré varios trámites que podrían ser el que buscas. Elige uno de ellos en la pantalla.";

export function mensajeAmbiguoClase(clase: string): string {
  return `Encontré varios trámites para licencia clase ${clase.toUpperCase()}. ¿Necesitas tu primera licencia o quieres renovar la licencia? Indicame cuál es tu caso para poder ayudarte mejor.`;
}

export const CANAL_DERIVACION = {
  nombre: "Dirección de Tránsito y Transporte Público - Municipalidad de Peñalolén",
  descripcion:
    "Canal oficial para consultas sobre trámites y servicios municipales.",
  url: "https://www.penalolen.cl",
};
