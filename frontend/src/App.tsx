import { useState } from "react";
import "./App.css";
import ConsultaForm from "./components/ConsultaForm";
import TramiteResult from "./components/TramiteResult";
import AbstentionMessage from "./components/AbstentionMessage";
import { consultarTramite } from "./services/tramitesApi";
import type { ConsultaResponse } from "./types/tramite";

type Estado = "idle" | "loading" | "success" | "no-match" | "error";

function App() {
  const [estado, setEstado] = useState<Estado>("idle");
  const [respuesta, setRespuesta] = useState<ConsultaResponse | null>(null);

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

  return (
    <main className="app">
      <h1>Asistente Virtual de Trámites Municipales</h1>
      <p className="subtitulo">Municipalidad de Peñalolén</p>

      <ConsultaForm onSubmit={handleConsulta} disabled={estado === "loading"} />

      {estado === "loading" && <p>Buscando información...</p>}

      {estado === "success" && respuesta?.encontrado && (
        <TramiteResult ficha={respuesta.ficha} />
      )}

      {estado === "no-match" && respuesta && !respuesta.encontrado && (
        <>
          <AbstentionMessage
            mensaje={respuesta.mensaje}
            canal={respuesta.canal_derivacion}
          />
          {respuesta.opciones && respuesta.opciones.length > 0 && (
            <div className="opciones">
              <p>¿Cuál de estos trámites necesitas?</p>
              {respuesta.opciones.map((opcion) => (
                <button
                  key={opcion.id}
                  type="button"
                  onClick={async () => {
                    setEstado("loading");
                    try {
                      const data = await consultarTramite("", opcion.id);
                      setRespuesta(data);
                      setEstado(data.encontrado ? "success" : "no-match");
                    } catch {
                      setEstado("error");
                    }
                  }}
                >
                  {opcion.tramite}
                </button>
              ))}
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
