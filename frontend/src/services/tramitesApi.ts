import type { ConsultaResponse } from "../types/tramite";


// Se reemplaza localhost por el nombre o IP desde donde se abre la página, para permitir las pruebas desde un celular en la misma red durante la demo.
const API_URL = `http://${window.location.hostname}:3001/api/tramites/consultar`;

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
