import { panel } from "../config";

/**
 * Límite simple de intentos de login por identidad (correo + dirección).
 *
 * Ventana fija en memoria: suficiente para frenar un intento de fuerza bruta
 * contra el panel sin agregar dependencias ni estado persistente. No es el
 * rate limiting general del ADR-02, que sigue pendiente.
 */

interface Ventana {
  inicio: number;
  fallos: number;
  bloqueado: boolean;
}

const ventanas = new Map<string, Ventana>();

function ventanaDe(clave: string): Ventana {
  const ahora = Date.now();
  const actual = ventanas.get(clave);
  if (!actual || ahora - actual.inicio > panel.ventanaIntentosMs) {
    const nueva = { inicio: ahora, fallos: 0, bloqueado: false };
    ventanas.set(clave, nueva);
    return nueva;
  }
  return actual;
}

/** `true` si esta identidad todavía puede intentar iniciar sesión. */
export function puedeIntentar(clave: string): boolean {
  return !ventanaDe(clave).bloqueado;
}

/** Registra un intento fallido y bloquea al superar el máximo de la ventana. */
export function registrarFallo(clave: string): void {
  const ventana = ventanaDe(clave);
  ventana.fallos += 1;
  if (ventana.fallos >= panel.intentosMaximos) {
    ventana.bloqueado = true;
  }
}

/** Borra los intentos tras un login exitoso. */
export function limpiarIntentos(clave: string): void {
  ventanas.delete(clave);
}

/** Solo para los tests: vacía el estado en memoria. */
export function reiniciarIntentos(): void {
  ventanas.clear();
}
