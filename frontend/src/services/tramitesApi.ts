import { ConsultaResponse } from "../types/tramite";

const API_URL = "http://localhost:3001/api/tramites/consultar";

export async function consultarTramite(pregunta: string): Promise<ConsultaResponse> {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pregunta }),
  });

  if (!response.ok) {
    throw new Error(`Error del servidor: ${response.status}`);
  }

  return response.json();
}
