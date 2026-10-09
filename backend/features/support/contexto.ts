import type { Response } from "supertest";

/**
 * Estado compartido entre los step definitions de Cucumber.
 *
 * Cada archivo `.steps.ts` vive en su propio módulo, por lo que la respuesta
 * HTTP de `POST /api/tramites/consultar` se guarda aquí para poder afirmar
 * sobre ella desde cualquier historia (US-01, US-06, US-09...).
 */
export const contexto: { response?: Response } = {};

export function respuesta(): Response {
  if (!contexto.response) {
    throw new Error(
      "No hay respuesta HTTP: falta ejecutar el paso 'Cuando consulto ...'."
    );
  }
  return contexto.response;
}
