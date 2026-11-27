import { Router, type Request, type Response } from "express";
import { firmarSesion } from "../auth/jwt";
import { limpiarIntentos, puedeIntentar, registrarFallo } from "../auth/intentos";
import { verificarPassword, hashPassword } from "../auth/password";
import { requiereSesion } from "../middleware/requiereSesion";
import {
  buscarUsuarioPorEmail,
  usuarioPublico,
} from "../services/usuariosRepository";

/**
 * Sesión del funcionario (US-05).
 *
 * El vecino no usa estas rutas: el asistente sigue siendo anónimo. Solo se
 * autentica quien necesita editar el catálogo desde el panel.
 */

const router = Router();

const MENSAJE_ERROR_LOGIN =
  "Usuario o contraseña incorrectos. Vuelve a intentarlo.";

function claveDe(req: Request, email: string): string {
  const ip = req.ip ?? req.socket.remoteAddress ?? "?";
  return `${email}::${ip}`;
}

router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body ?? {};

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      email.trim().length === 0 ||
      password.length === 0
    ) {
      return res.status(400).json({
        error: "Ingresa tu correo y tu contraseña para iniciar sesión.",
      });
    }

    const clave = claveDe(req, email.trim().toLowerCase());
    if (!puedeIntentar(clave)) {
      return res.status(429).json({
        error:
          "Demasiados intentos fallidos. Espera unos minutos y vuelve a intentarlo.",
      });
    }

    const usuario = await buscarUsuarioPorEmail(email);
    // Comparación en tiempo constante: si el usuario no existe igualmente se
    // ejecuta un scrypt, para no revelar por el tiempo quiénes están registrados.
    const hash = usuario?.hash ?? hashPassword("usuario-inexistente");
    const coincide = verificarPassword(password, hash) && usuario !== null;

    if (!usuario || !coincide) {
      registrarFallo(clave);
      return res.status(401).json({ error: MENSAJE_ERROR_LOGIN });
    }

    limpiarIntentos(clave);
    const token = await firmarSesion({
      sub: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol,
    });

    return res.status(200).json({ token, usuario: usuarioPublico(usuario) });
  } catch (error) {
    console.error("Error en el login:", error);
    return res.status(500).json({ error: "Error interno del servidor." });
  }
});

// Quién tiene la sesión: lo usa el panel para mostrar el nombre y verificar
// que el token sigue vigente antes de cargar los datos.
router.get("/me", requiereSesion, (req: Request, res: Response) => {
  const sesion = req.sesion;
  if (!sesion) {
    return res.status(401).json({ error: "No hay sesión activa." });
  }
  return res.status(200).json({
    usuario: {
      id: sesion.sub,
      nombre: sesion.nombre,
      email: sesion.email,
      rol: sesion.rol,
    },
  });
});

export default router;
