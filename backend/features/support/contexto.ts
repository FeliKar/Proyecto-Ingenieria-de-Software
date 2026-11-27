import type { Response } from "supertest";

/**
 * Estado compartido entre los step definitions de Cucumber.
 *
 * Cada archivo `.steps.ts` vive en su propio módulo, por lo que la respuesta
 * HTTP de `POST /api/tramites/consultar` se guarda aquí para poder afirmar
 * sobre ella desde cualquier historia (US-01, US-06, US-09...) y el token de
 * sesión del funcionario para las historias del panel (US-05).
 */
export const contexto: { response?: Response; token?: string } = {};

export function respuesta(): Response {
  if (!contexto.response) {
    throw new Error(
      "No hay respuesta HTTP: falta ejecutar el paso 'Cuando consulto ...'."
    );
  }
  return contexto.response;
}

export function token(): string {
  if (!contexto.token) {
    throw new Error(
      "No hay token: falta el paso 'Dado que inicié sesión como funcionario'."
    );
  }
  return contexto.token;
}
