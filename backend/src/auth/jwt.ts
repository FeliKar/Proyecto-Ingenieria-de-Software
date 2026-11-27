import { SignJWT, jwtVerify } from "jose";
import { panel } from "../config";

/**
 * Sesión del funcionario.
 *
 * Los vecinos no inician sesión: este token solo existe para el panel (US-05).
 * `sub` es el id del funcionario; `rol` queda para autorización futura.
 */
export interface Sesion {
  sub: string;
  nombre: string;
  email: string;
  rol: string;
}

function clave(): Uint8Array {
  return new TextEncoder().encode(panel.secreto);
}

export async function firmarSesion(sesion: Sesion): Promise<string> {
  return new SignJWT({ nombre: sesion.nombre, email: sesion.email, rol: sesion.rol })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(sesion.sub)
    .setIssuedAt()
    .setExpirationTime(`${panel.ttlMinutos}m`)
    .sign(clave());
}

/**
 * Devuelve la sesión válida o `null` si el token no existe, venció o fue
 * manipulado. Nunca lanza: la ruta decide qué responder.
 */
export async function verificarSesion(token: string): Promise<Sesion | null> {
  try {
    const { payload } = await jwtVerify(token, clave(), {
      algorithms: ["HS256"],
    });
    if (typeof payload.sub !== "string" || payload.sub.length === 0) {
      return null;
    }
    return {
      sub: payload.sub,
      nombre: typeof payload.nombre === "string" ? payload.nombre : "",
      email: typeof payload.email === "string" ? payload.email : "",
      rol: typeof payload.rol === "string" ? payload.rol : "funcionario",
    };
  } catch {
    return null;
  }
}
