export const ABSTENCION_MENSAJE =
  "No encontré información suficiente para responder tu consulta con confianza. Para evitar entregar datos incorrectos, te derivo al canal oficial.";

export function mensajeAmbiguoClase(clase: string): string {
  return `Encontré varios trámites para licencia clase ${clase.toUpperCase()}. ¿Necesitas tu primera licencia o quieres renovar la licencia? Indicame cuál es tu caso para poder ayudarte mejor.`;
}

export const CANAL_DERIVACION = {
  nombre: "Dirección de Tránsito y Transporte Público - Municipalidad de Peñalolén",
  descripcion:
    "Canal oficial para consultas sobre trámites y servicios municipales.",
  url: "https://www.penalolen.cl",
};
