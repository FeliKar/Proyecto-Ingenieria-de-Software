import { Router, type Request, type Response } from "express";
import { requiereSesion } from "../middleware/requiereSesion";
import {
  crearFicha,
  actualizarFicha,
  eliminarFicha,
  ErrorPanel,
  listarFichas,
  type EntradaPanel,
} from "../services/panelService";

/**
 * API del panel de funcionarios (US-05).
 *
 * Toda esta ruta exige sesión de funcionario; los vecinos no la usan. Los
 * cambios se validan igual que en la carga de datos (US-09) y quedan visibles
 * para la consulta del vecino en el momento.
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
  if (error instanceof ErrorPanel) {
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

router.delete("/tramites/:id", async (req: Request, res: Response) => {
  try {
    await eliminarFicha(String(req.params.id));
    return res.status(200).json({
      ok: true,
      mensaje: "Trámite eliminado del catálogo.",
    });
  } catch (error) {
    return responderError(res, error);
  }
});

export default router;
