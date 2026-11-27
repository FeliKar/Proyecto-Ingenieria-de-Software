import type { Rol } from "../types/panel";

/**
 * Reglas de autorización del panel (ADR-05).
 *
 * El backend las aplica con `requiereRol`; aquí se replican solo para no
 * mostrar botones que el servidor rechazaría con 403. La fuente de verdad
 * sigue siendo el token firmado, no esta función.
 */

/** Cualquier funcionario crea y edita trámites. */
export function puedeEditarTramites(rol: Rol | undefined): boolean {
  return rol === "admin" || rol === "funcionario";
}

/** Borrar trámites es exclusivo de admin. */
export function puedeEliminarTramite(rol: Rol | undefined): boolean {
  return rol === "admin";
}

/** Administrar usuarios y sus roles es exclusivo de admin. */
export function puedeAdministrarUsuarios(rol: Rol | undefined): boolean {
  return rol === "admin";
}
