import { existsSync, readFileSync } from "node:fs";
import { panel, praxsuite, usuarios } from "../config";
import { consultarTabla } from "./tramitesRepository";

/**
 * Funcionarios que pueden iniciar sesión al panel (US-05).
 *
 * - Con Praxsuite configurado, se leen de la tabla `Usuarios` del workspace.
 * - Sin credenciales (o si el gateway falla), del archivo local
 *   `src/data/usuarios.json`. Así los tests y el desarrollo local funcionan
 *   sin red, igual que con las fichas.
 *
 * Nunca se devuelve la contraseña: el hash solo se usa para comparar.
 */

export interface UsuarioFuncionario {
  id: string;
  email: string;
  nombre: string;
  hash: string;
  rol: string;
}

export type UsuarioPublico = Omit<UsuarioFuncionario, "hash">;

export function usuarioPublico(usuario: UsuarioFuncionario): UsuarioPublico {
  const { hash: _hash, ...publico } = usuario;
  return publico;
}

function normalizarEmail(email: string): string {
  return email.trim().toLowerCase();
}

function usuarioDeFila(fila: Record<string, unknown>): UsuarioFuncionario | null {
  const texto = (v: unknown) => (typeof v === "string" ? v.trim() : "");
  const email = texto(fila.Email ?? fila.email);
  const hash = texto(fila.Hash ?? fila.hash ?? fila.Password);
  if (!email || !hash) return null;
  return {
    id: texto(fila.ID ?? fila.id) || email,
    email: normalizarEmail(email),
    nombre: texto(fila.Nombre ?? fila.nombre) || email,
    hash,
    rol: texto(fila.Rol ?? fila.rol) || "funcionario",
  };
}

function usuariosLocales(): UsuarioFuncionario[] {
  if (!existsSync(panel.usuariosJson)) return [];
  try {
    const crudo = JSON.parse(readFileSync(panel.usuariosJson, "utf8"));
    if (!Array.isArray(crudo)) return [];
    return crudo
      .map((fila) => usuarioDeFila(fila as Record<string, unknown>))
      .filter((u): u is UsuarioFuncionario => u !== null);
  } catch (error) {
    console.warn(
      `No se pudo leer '${panel.usuariosJson}': ${
        error instanceof Error ? error.message : String(error)
      }`
    );
    return [];
  }
}

/**
 * Busca un funcionario por correo. Devuelve `null` si no existe o si la fuente
 * no está disponible: el mensaje de error del login es siempre el mismo para
 * no revelar si el correo está registrado.
 */
export async function buscarUsuarioPorEmail(
  email: string
): Promise<UsuarioFuncionario | null> {
  const buscado = normalizarEmail(email);
  if (!buscado) return null;

  if (praxsuite.habilitado) {
    try {
      const filas = await consultarTabla(usuarios.tabla, [
        "ID",
        "Email",
        "Nombre",
        "Hash",
        "Rol",
      ]);
      const encontrado = filas
        .map(usuarioDeFila)
        .filter((u): u is UsuarioFuncionario => u !== null)
        .find((u) => u.email === buscado);
      if (encontrado) return encontrado;
      // Sin coincidencia en Praxsuite se sigue con el archivo local.
    } catch (error) {
      console.warn(
        `Praxsuite no respondió al leer usuarios, se usa el archivo local: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  return usuariosLocales().find((u) => u.email === buscado) ?? null;
}
