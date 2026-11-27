import { Router, type Request, type Response } from "express";
import { requiereRol, requiereSesion } from "../middleware/requiereSesion";
import {
  crearFicha,
  actualizarFicha,
  eliminarFicha,
  ErrorPanel,
  listarFichas,
  type EntradaPanel,
} from "../services/panelService";
import {
  actualizarRol,
  esRol,
  ErrorUsuarios,
  listarUsuarios,
} from "../services/usuariosRepository";

/**
 * API del panel de funcionarios (US-05).
 *
 * Toda esta ruta exige sesión de funcionario; los vecinos no la usan. Los
 * cambios se validan igual que en la carga de datos (US-09) y quedan visibles
 * para la consulta del vecino en el momento.
 *
 * Roles (ADR-05): cualquier funcionario crea y edita; borrar trámites y
 * administrar usuarios es solo de `admin`.
 */

const router = Router();

router.use(requiereSesion);

function entradaDe(req: Request): EntradaPanel {
  const cuerpo = req.body ?? {};
  return typeof cuerpo === "object" && cuerpo !== null
    ? (cuerpo as EntradaPanel)
    : ({} as EntradaPanel);
}

function responderError(res: Response, error: unknown): Response {
  if (error instanceof ErrorPanel || error instanceof ErrorUsuarios) {
    return res.status(error.status).json({ error: error.message });
  }
  console.error("Error en el panel:", error);
  return res.status(500).json({ error: "Error interno del servidor." });
}

router.get("/tramites", async (_req: Request, res: Response) => {
  try {
    return res.status(200).json(await listarFichas());
  } catch (error) {
    return responderError(res, error);
  }
});

router.post("/tramites", async (req: Request, res: Response) => {
  try {
    const ficha = await crearFicha(entradaDe(req));
    return res.status(201).json({ ficha });
  } catch (error) {
    return responderError(res, error);
  }
});

router.put("/tramites/:id", async (req: Request, res: Response) => {
  try {
    const ficha = await actualizarFicha(String(req.params.id), entradaDe(req));
    return res.status(200).json({ ficha });
  } catch (error) {
    return responderError(res, error);
  }
});

// Borrar es solo para admin (ADR-05): cualquier funcionario crea y edita.
router.delete(
  "/tramites/:id",
  requiereRol("admin"),
  async (req: Request, res: Response) => {
    try {
      await eliminarFicha(String(req.params.id));
      return res.status(200).json({
        ok: true,
        mensaje: "Trámite eliminado del catálogo.",
      });
    } catch (error) {
      return responderError(res, error);
    }
  }
);

// --------------------- administración de usuarios (admin) -------------------

router.get("/usuarios", requiereRol("admin"), async (_req, res) => {
  try {
    return res.status(200).json({ usuarios: await listarUsuarios() });
  } catch (error) {
    return responderError(res, error);
  }
});

/**
 * Cambia el rol de un funcionario en la fuente activa (Praxsuite o JSON).
 * Dos reglas: el rol debe existir y nadie puede cambiar el suyo propio, así
 * el equipo nunca se queda sin administradores.
 */
router.put(
  "/usuarios/:id/rol",
  requiereRol("admin"),
  async (req: Request, res: Response) => {
    try {
      const rol = req.body?.rol;
      if (!esRol(rol)) {
        return res.status(400).json({
          error: "El rol debe ser 'admin' o 'funcionario'.",
        });
      }

      const id = String(req.params.id);
      if (req.sesion?.sub === id) {
        return res.status(400).json({
          error:
            "No puedes cambiar tu propio rol: así nunca quedarías sin administradores.",
        });
      }

      const usuario = await actualizarRol(id, rol);
      return res.status(200).json({ usuario });
    } catch (error) {
      return responderError(res, error);
    }
  }
);

export default router;
