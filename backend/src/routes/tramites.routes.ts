import { Router, Request, Response } from "express";
import { TramiteService } from "../services/tramiteService";
import { validarConsulta } from "../middleware/validarConsulta";
import { estadoFuente } from "../services/tramitesRepository";

const router = Router();

// Diagnóstico de la fuente: útil para saber si se está leyendo Praxsuite o el
// respaldo local sin exponer credenciales.
router.get("/estado", async (_req: Request, res: Response) => {
  try {
    return res.status(200).json(await estadoFuente());
  } catch (error) {
    console.error("Error consultando la fuente de trámites:", error);
    return res.status(500).json({ error: "Error interno del servidor." });
  }
});

// La ruta solo recibe la consulta ya validada y traduce el resultado a HTTP.
router.post(
  "/consultar",
  validarConsulta,
  async (req: Request, res: Response) => {
    try {
      const { pregunta, tramiteId } = req.body;
      // El servicio se crea por petición con las fichas de la fuente activa
      // (Praxsuite o JSON locales); el repositorio las mantiene en caché.
      const servicio = await TramiteService.desdeFuente();

      if (typeof tramiteId === "string" && tramiteId.trim().length > 0) {
        const ficha = servicio.buscarPorId(tramiteId);
        if (!ficha) {
          return res
            .status(404)
            .json({ error: "No existe una ficha con ese id." });
        }
        return res.status(200).json({ encontrado: true, ficha });
      }

      return res.status(200).json(servicio.consultar(pregunta));
    } catch (error) {
      console.error("Error inesperado:", error);
      return res.status(500).json({ error: "Error interno del servidor." });
    }
  }
);

export default router;
