import type {
  EntradaPanel,
  FichaPanel,
  UsuarioPanel,
} from "../types/panel";

/**
 * API del panel de funcionarios (US-05).
 *
 * El token se guarda en el navegador del funcionario y viaja en la cabecera
 * `Authorization: Bearer`. Si el backend responde 401, `ErrorApi.status`
 * permite cerrar la sesión y volver al login.
 */

const CLAVE_TOKEN = "munichat:token-panel";
const BASE = "/api";

export class ErrorApi extends Error {
  readonly status: number;

  constructor(status: number, mensaje: string) {
    super(mensaje);
    this.status = status;
  }
}

export function leerToken(): string | null {
  try {
    return localStorage.getItem(CLAVE_TOKEN);
  } catch {
    return null;
  }
}

export function guardarToken(token: string | null): void {
  try {
    if (token) localStorage.setItem(CLAVE_TOKEN, token);
    else localStorage.removeItem(CLAVE_TOKEN);
  } catch {
    // Navegador en modo privado: la sesión no se recordará entre visitas.
  }
}

async function pedir<T>(
  ruta: string,
  opciones: { method?: string; body?: unknown } = {}
): Promise<T> {
  const token = leerToken();
  const respuesta = await fetch(`${BASE}${ruta}`, {
    method: opciones.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(opciones.body !== undefined
      ? { body: JSON.stringify(opciones.body) }
      : {}),
  });

  const cuerpo = await respuesta.json().catch(() => ({}));

  if (!respuesta.ok) {
    throw new ErrorApi(
      respuesta.status,
      typeof cuerpo.error === "string"
        ? cuerpo.error
        : `Error del servidor: ${respuesta.status}`
    );
  }

  return cuerpo as T;
}

export async function iniciarSesion(
  email: string,
  password: string
): Promise<{ token: string; usuario: UsuarioPanel }> {
  const datos = await pedir<{ token: string; usuario: UsuarioPanel }>(
    "/auth/login",
    { method: "POST", body: { email, password } }
  );
  guardarToken(datos.token);
  return datos;
}

export function quienSoy(): Promise<{ usuario: UsuarioPanel }> {
  return pedir<{ usuario: UsuarioPanel }>("/auth/me");
}

export function cerrarSesion(): void {
  guardarToken(null);
}

export function listarTramites(): Promise<{
  origen: "praxsuite" | "json";
  tramites: FichaPanel[];
}> {
  return pedir<{ origen: "praxsuite" | "json"; tramites: FichaPanel[] }>(
    "/panel/tramites"
  );
}

export function guardarTramite(
  id: string | null,
  entrada: EntradaPanel
): Promise<{ ficha: FichaPanel }> {
  return pedir<{ ficha: FichaPanel }>(
    id ? `/panel/tramites/${encodeURIComponent(id)}` : "/panel/tramites",
    { method: id ? "PUT" : "POST", body: entrada }
  );
}

export function eliminarTramite(id: string): Promise<{ ok: boolean }> {
  return pedir<{ ok: boolean }>(`/panel/tramites/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}
