import { useCallback, useEffect, useRef, useState } from "react";
import { mensajeErrorVoz } from "../services/voz";

// Tipos mínimos de la Web Speech API (no están incluidos en lib.dom).
interface ResultadoEvento {
  isFinal: boolean;
  0: { transcript: string };
}

interface EventoResultados {
  length: number;
  [indice: number]: ResultadoEvento;
}

interface EventoResultadosVoz {
  results: EventoResultados;
}

interface EventoErrorVoz {
  error: string;
}

interface ReconocedorVoz {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onstart: (() => void) | null;
  onresult: ((evento: EventoResultadosVoz) => void) | null;
  onerror: ((evento: EventoErrorVoz) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

type ConstructorReconocedor = new () => ReconocedorVoz;

function constructorReconocedor(): ConstructorReconocedor | null {
  if (typeof window === "undefined") return null;
  const nav = window as unknown as {
    SpeechRecognition?: ConstructorReconocedor;
    webkitSpeechRecognition?: ConstructorReconocedor;
  };
  return nav.SpeechRecognition ?? nav.webkitSpeechRecognition ?? null;
}

export type EstadoVoz = "inactivo" | "escuchando" | "listo";

export interface UsoReconocimientoVoz {
  soportado: boolean;
  estado: EstadoVoz;
  transcripcion: string;
  error: string | null;
  iniciar: () => void;
  detener: () => void;
  reiniciar: () => void;
}

export function useSpeechRecognition(): UsoReconocimientoVoz {
  const Constructor = constructorReconocedor();
  const soportado = Constructor !== null;

  const [estado, setEstado] = useState<EstadoVoz>("inactivo");
  const [transcripcion, setTranscripcion] = useState("");
  const [error, setError] = useState<string | null>(null);

  const reconocedorRef = useRef<ReconocedorVoz | null>(null);
  const finalizadoRef = useRef(false);
  const montadoRef = useRef(true);

  useEffect(() => {
    montadoRef.current = true;
    return () => {
      montadoRef.current = false;
      reconocedorRef.current?.abort();
      reconocedorRef.current = null;
    };
  }, []);

  const reiniciar = useCallback(() => {
    if (!montadoRef.current) return;
    setTranscripcion("");
    setError(null);
    setEstado("inactivo");
  }, []);

  const iniciar = useCallback(() => {
    if (!soportado || !Constructor || !montadoRef.current) return;

    reconocedorRef.current?.abort();
    finalizadoRef.current = false;
    setTranscripcion("");
    setError(null);

    const reconocedor = new Constructor();
    reconocedor.lang = "es-CL";
    reconocedor.continuous = false;
    reconocedor.interimResults = true;
    reconocedor.maxAlternatives = 1;

    reconocedor.onstart = () => {
      if (!montadoRef.current) return;
      setEstado("escuchando");
    };

    reconocedor.onresult = (evento) => {
      let texto = "";
      let hayFinal = false;
      for (let i = 0; i < evento.results.length; i++) {
        texto += evento.results[i][0].transcript;
        if (evento.results[i].isFinal) hayFinal = true;
      }
      if (!montadoRef.current) return;
      setTranscripcion(texto.trim());
      if (hayFinal) finalizadoRef.current = true;
    };

    reconocedor.onerror = (evento) => {
      if (!montadoRef.current) return;
      if (evento.error === "aborted") return;
      setError(mensajeErrorVoz(evento.error));
    };

    reconocedor.onend = () => {
      if (!montadoRef.current) return;
      if (finalizadoRef.current) {
        setEstado("listo");
      } else {
        setEstado("inactivo");
        setError((prev) => prev ?? mensajeErrorVoz("no-speech"));
      }
    };

    reconocedorRef.current = reconocedor;
    try {
      reconocedor.start();
    } catch {
      setError(mensajeErrorVoz("network"));
      setEstado("inactivo");
    }
  }, [Constructor, soportado]);

  const detener = useCallback(() => {
    reconocedorRef.current?.stop();
  }, []);

  return { soportado, estado, transcripcion, error, iniciar, detener, reiniciar };
}
