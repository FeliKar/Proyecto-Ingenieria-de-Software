import type { NextFunction, Request, Response } from "express";
import { verificarSesion, type Sesion } from "../auth/jwt";

declare global {
  namespace Express {
    interface Request {
      /** Sesión del funcionario; solo las rutas del panel la tienen. */
      sesion?: Sesion;
    }
  }
}

/**
 * Exige una sesión válida de funcionario (US-05).
 *
 * Los vecinos no inician sesión: este middleware solo protege `/api/panel`.
 * Lee el token de la cabecera `Authorization: Bearer <token>` y corta con 401
 * si falta, venció o fue manipulado.
 */
export async function requiereSesion(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const cabecera = req.headers.authorization ?? "";
  const token = cabecera.startsWith("Bearer ")
    ? cabecera.slice("Bearer ".length).trim()
    : "";

  if (!token) {
    res.status(401).json({
      error: "Debes iniciar sesión para entrar al panel de funcionarios.",
    });
    return;
  }

  const sesion = await verificarSesion(token);
  if (!sesion) {
    res.status(401).json({
      error: "Tu sesión expiró. Vuelve a iniciar sesión.",
    });
    return;
  }

  req.sesion = sesion;
  next();
}
