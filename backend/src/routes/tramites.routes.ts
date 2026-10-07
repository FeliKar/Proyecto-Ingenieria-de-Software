import { Router, Request, Response } from "express";
import fichas from "../data/fichas.json";
import type { FichaTramite } from "../types/ficha";
import { matchTramite } from "../services/tramiteMatcher";
import { ABSTENCION_MENSAJE, CANAL_DERIVACION } from "../constants/abstention";

const router = Router();

router.post("/consultar", (req: Request, res: Response) => {
  try {
    const { pregunta } = req.body ?? {};

    if (typeof pregunta !== "string" || pregunta.trim().length === 0) {
      return res.status(400).json({
        error: "Solicitud inválida: 'pregunta' debe ser un texto no vacío.",
      });
    }

    const ficha = matchTramite(pregunta, fichas as FichaTramite[]);

    if (!ficha) {
      return res.status(200).json({
        encontrado: false,
        abstencion: true,
        mensaje: ABSTENCION_MENSAJE,
        canal_derivacion: CANAL_DERIVACION,
      });
    }

    return res.status(200).json({
      encontrado: true,
      ficha: {
        id: ficha.id,
        tramite: ficha.tramite,
        requisitos: ficha.requisitos,
        pasos: ficha.pasos,
        vigencia: ficha.vigencia,
        enlace_oficial: ficha.enlace_oficial,
      },
    });
  } catch (error) {
    console.error("Error inesperado:", error);
    return res.status(500).json({ error: "Error interno del servidor." });
  }
});

export default router;
