import type { Request, Response, NextFunction } from "express";

// Largo máximo de una pregunta. Una consulta real cabe de sobra en 300
// caracteres; la prueba de estrés mostró que preguntas de ~20.000 caracteres
// dejan al servidor casi sin servicio para el resto (riesgo R7, ADR-02).
export const LARGO_MAXIMO_PREGUNTA = 300;

/**
 * Valida la entrada de POST /api/tramites/consultar antes de que llegue a la
 * lógica de negocio. Si la petición no es válida, responde y corta la cadena;
 * si lo es, deja pasar a la ruta.
 */
export function validarConsulta(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const { pregunta, tramiteId } = req.body ?? {};

  // Elección explícita desde una consulta ambigua: no trae pregunta.
  if (typeof tramiteId === "string" && tramiteId.trim().length > 0) {
    return next();
  }

  if (typeof pregunta !== "string" || pregunta.trim().length === 0) {
    return res.status(400).json({
      error: "Solicitud inválida: 'pregunta' debe ser un texto no vacío.",
    });
  }

  if (pregunta.length > LARGO_MAXIMO_PREGUNTA) {
    return res.status(413).json({
      error: `La pregunta es demasiado larga: escribe como máximo ${LARGO_MAXIMO_PREGUNTA} caracteres.`,
    });
  }

  return next();
}
