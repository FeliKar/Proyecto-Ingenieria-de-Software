import type { ConsultaResponse } from "../types/tramite";

// Misma dirección que sirve la página (proxy de Vite hacia el backend en dev).
// En producción el servidor estático debe configurar el mismo proxy de /api.
const API_URL = "/api/tramites/consultar";

export async function consultarTramite(
  pregunta: string,
  tramiteId?: string
): Promise<ConsultaResponse> {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(tramiteId ? { tramiteId } : { pregunta }),
  });

  if (!response.ok) {
    throw new Error(`Error del servidor: ${response.status}`);
  }

  return response.json();
}
