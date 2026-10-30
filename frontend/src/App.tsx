import { useEffect, useRef, useState } from "react";
import "./App.css";
import BotonModoAccesibilidad from "./components/BotonModoAccesibilidad";
import ConsultaForm from "./components/ConsultaForm";
import ConfirmacionVoz from "./components/ConfirmacionVoz";
import TramiteResult from "./components/TramiteResult";
import AbstentionMessage from "./components/AbstentionMessage";
import { consultarTramite } from "./services/tramitesApi";
import {
  detenerLectura,
  lecturaDisponible,
  leer,
  textoAbstencion,
  textoConfirmacion,
  textoFicha,
  MENSAJE_ERROR_VOZ,
} from "./services/voz";
import { useSpeechRecognition } from "./hooks/useSpeechRecognition";
import type { ConsultaResponse } from "./types/tramite";

type Estado = "idle" | "loading" | "success" | "no-match" | "error";

// Preferencia del modo accesibilidad (micrófono + lectura en voz alta).
const CLAVE_MODO_ACCESIBILIDAD = "munichat:modo-accesibilidad";

function leerModoAccesibilidad(): boolean {
  try {
    return localStorage.getItem(CLAVE_MODO_ACCESIBILIDAD) === "1";
  } catch {
    return false;
  }
}

function App() {
  const [estado, setEstado] = useState<Estado>("idle");
  const [respuesta, setRespuesta] = useState<ConsultaResponse | null>(null);
  const [confirmandoVoz, setConfirmandoVoz] = useState(false);
  const [modoAccesibilidad, setModoAccesibilidad] =
    useState<boolean>(leerModoAccesibilidad);

  const voz = useSpeechRecognition();
  const confirmacionLeidaRef = useRef("");

  // Al terminar de hablar: pedir confirmación y leer lo escuchado en voz alta.
  useEffect(() => {
    if (!modoAccesibilidad) return;
    if (
      voz.estado === "listo" &&
      voz.transcripcion &&
      confirmacionLeidaRef.current !== voz.transcripcion
    ) {
      confirmacionLeidaRef.current = voz.transcripcion;
      setConfirmandoVoz(true);
      leer(textoConfirmacion(voz.transcripcion));
    }
  }, [modoAccesibilidad, voz.estado, voz.transcripcion]);

  // Leer la respuesta completa en voz alta (ficha, abstención o error).
  // Solo en modo accesibilidad; sin él la página opera normal, sin lectura.
  useEffect(() => {
    if (!modoAccesibilidad || !lecturaDisponible()) return;
    if (estado === "success" && respuesta?.encontrado) {
      leer(textoFicha(respuesta.ficha));
    } else if (estado === "no-match" && respuesta && !respuesta.encontrado) {
      leer(textoAbstencion(respuesta.mensaje, respuesta.opciones));
    } else if (estado === "error") {
      leer(MENSAJE_ERROR_VOZ);
    }
  }, [modoAccesibilidad, estado, respuesta]);

  useEffect(() => {
    return () => detenerLectura();
  }, []);

  const handleToggleModoAccesibilidad = () => {
    const activado = !modoAccesibilidad;
    setModoAccesibilidad(activado);
    try {
      localStorage.setItem(CLAVE_MODO_ACCESIBILIDAD, activado ? "1" : "0");
    } catch {
      // Navegador en modo privado: el modo no se recordará entre visitas.
    }
    // Al apagar, no queda nada hablando ni esperando confirmación.
    detenerLectura();
    setConfirmandoVoz(false);
    confirmacionLeidaRef.current = "";
    voz.reiniciar();
  };

  const handleConsulta = async (pregunta: string) => {
    setEstado("loading");
    setRespuesta(null);
    try {
      const data = await consultarTramite(pregunta);
      setRespuesta(data);
      setEstado(data.encontrado ? "success" : "no-match");
    } catch {
      setEstado("error");
    }
  };

  const handleMicrofono = () => {
    setConfirmandoVoz(false);
    confirmacionLeidaRef.current = "";
    if (voz.estado === "escuchando") {
      voz.detener();
    } else {
      detenerLectura();
      voz.iniciar();
    }
  };

  const handleBuscarPorVoz = () => {
    const pregunta = voz.transcripcion;
    setConfirmandoVoz(false);
    voz.reiniciar();
    if (pregunta.trim()) void handleConsulta(pregunta.trim());
  };

  const handleHablarOtraVez = () => {
    setConfirmandoVoz(false);
    voz.reiniciar();
    detenerLectura();
    voz.iniciar();
  };

  const mensajeLeible =
    estado === "success" && respuesta?.encontrado
      ? textoFicha(respuesta.ficha)
      : estado === "no-match" && respuesta && !respuesta.encontrado
        ? textoAbstencion(respuesta.mensaje, respuesta.opciones)
        : "";

  const mostrarControlesLectura =
    modoAccesibilidad && lecturaDisponible() && mensajeLeible.length > 0;

  return (
    <main className="app">
      <header className="app__cabecera">
        <div>
          <h1>Asistente Virtual de Trámites Municipales</h1>
          <p className="subtitulo">Municipalidad de Peñalolén</p>
        </div>
        <BotonModoAccesibilidad
          activo={modoAccesibilidad}
          onToggle={handleToggleModoAccesibilidad}
        />
      </header>

      <ConsultaForm
        onSubmit={handleConsulta}
        disabled={estado === "loading"}
        conVoz={modoAccesibilidad}
        vozSoportada={voz.soportado}
        estadoVoz={voz.estado}
        transcripcionVoz={voz.transcripcion}
        errorVoz={voz.error}
        onMicrofono={handleMicrofono}
      />

      {modoAccesibilidad && confirmandoVoz && (
        <ConfirmacionVoz
          transcripcion={voz.transcripcion}
          onBuscar={handleBuscarPorVoz}
          onHablarOtraVez={handleHablarOtraVez}
          onEscucharDeNuevo={() => leer(textoConfirmacion(voz.transcripcion))}
          disabled={estado === "loading"}
        />
      )}

      {estado === "loading" && <p>Buscando información...</p>}

      {estado === "success" && respuesta?.encontrado && (
        <>
          <TramiteResult ficha={respuesta.ficha} />
          {mostrarControlesLectura && (
            <div className="lectura-controles">
              <button type="button" onClick={() => leer(mensajeLeible)}>
                <span aria-hidden="true">🔊</span> Escuchar de nuevo
              </button>
              <button type="button" onClick={detenerLectura}>
                <span aria-hidden="true">🔇</span> Detener
              </button>
            </div>
          )}
        </>
      )}

      {estado === "no-match" && respuesta && !respuesta.encontrado && (
        <>
          <AbstentionMessage
            mensaje={respuesta.mensaje}
            canal={respuesta.canal_derivacion}
            opciones={respuesta.opciones}
            onElegirOpcion={async (id) => {
              setEstado("loading");
              try {
                const data = await consultarTramite("", id);
                setRespuesta(data);
                setEstado(data.encontrado ? "success" : "no-match");
              } catch {
                setEstado("error");
              }
            }}
          />
          {mostrarControlesLectura && (
            <div className="lectura-controles">
              <button type="button" onClick={() => leer(mensajeLeible)}>
                <span aria-hidden="true">🔊</span> Escuchar de nuevo
              </button>
              <button type="button" onClick={detenerLectura}>
                <span aria-hidden="true">🔇</span> Detener
              </button>
            </div>
          )}
        </>
      )}

      {estado === "error" && (
        <p className="error">
          No se pudo conectar con el servidor. Verifica que el backend esté en
          ejecución e inténtalo nuevamente.
        </p>
      )}
    </main>
  );
}

export default App;
