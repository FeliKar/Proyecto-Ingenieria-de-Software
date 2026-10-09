import { Router, Request, Response } from "express";
import fichas from "../data/fichas.json";
import type { FichaTramite } from "../types/ficha";
import { matchTramiteDetalle } from "../services/tramiteMatcher";
import { cargarFichasValidas } from "../services/fichaValidator";
import {
  ABSTENCION_MENSAJE,
  CANAL_DERIVACION,
  mensajeAmbiguoClase,
} from "../constants/abstention";

const router = Router();

// Solo las fichas válidas pueden responder consultas: una ficha sin enlace
// oficial se rechaza y nunca se sustituye por una URL inventada.
const fichasValidas: FichaTramite[] = cargarFichasValidas(
  fichas as FichaTramite[]
);

router.post("/consultar", (req: Request, res: Response) => {
  try {
    const { pregunta, tramiteId } = req.body ?? {};

    // Elección explícita desde la consulta ambigua
    if (typeof tramiteId === "string" && tramiteId.trim().length > 0) {
      const ficha = fichasValidas.find((f) => f.id === tramiteId);
      if (!ficha) {
        return res
          .status(404)
          .json({ error: "No existe una ficha con ese id." });
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
    }

    if (typeof pregunta !== "string" || pregunta.trim().length === 0) {
      return res.status(400).json({
        error: "Solicitud inválida: 'pregunta' debe ser un texto no vacío.",
      });
    }

    const { ficha, motivo, clase, opciones } = matchTramiteDetalle(
      pregunta,
      fichasValidas
    );

    if (!ficha) {
      return res.status(200).json({
        encontrado: false,
        abstencion: true,
        motivo,
        mensaje:
          motivo === "ambiguo"
            ? clase
              ? mensajeAmbiguoClase(clase)
              : "Encontré varios trámites que podrían ser lo que buscas. ¿Lo necesitas por primera vez o quieres renovar el trámite? Elige una de las opciones."
            : ABSTENCION_MENSAJE,
        canal_derivacion: CANAL_DERIVACION,
        ...(opciones ? { opciones } : {}),
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
