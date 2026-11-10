import { Router, Request, Response } from "express";
import { TramiteService } from "../services/tramiteService";
import { validarConsulta } from "../middleware/validarConsulta";

const router = Router();
const servicio = TramiteService.desdeDatos();

// La ruta solo recibe la consulta ya validada y traduce el resultado a HTTP.
router.post("/consultar", validarConsulta, (req: Request, res: Response) => {
  try {
    const { pregunta, tramiteId } = req.body;

    if (typeof tramiteId === "string" && tramiteId.trim().length > 0) {
      const ficha = servicio.buscarPorId(tramiteId);
      if (!ficha) {
        return res.status(404).json({ error: "No existe una ficha con ese id." });
      }
      return res.status(200).json({ encontrado: true, ficha });
    }

    return res.status(200).json(servicio.consultar(pregunta));
  } catch (error) {
    console.error("Error inesperado:", error);
    return res.status(500).json({ error: "Error interno del servidor." });
  }
});

export default router;
