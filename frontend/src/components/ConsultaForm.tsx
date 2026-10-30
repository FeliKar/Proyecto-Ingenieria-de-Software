import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import VozBoton from "./VozBoton";
import type { EstadoVoz } from "../hooks/useSpeechRecognition";
import { avisoEntornoVoz, diagnosticarEntornoVoz } from "../services/voz";

interface Props {
  onSubmit: (pregunta: string) => void;
  disabled?: boolean;
  conVoz: boolean;
  vozSoportada: boolean;
  estadoVoz: EstadoVoz;
  transcripcionVoz: string;
  errorVoz: string | null;
  onMicrofono: () => void;
}

export default function ConsultaForm({
  onSubmit,
  disabled,
  conVoz,
  vozSoportada,
  estadoVoz,
  transcripcionVoz,
  errorVoz,
  onMicrofono,
}: Props) {
  const [pregunta, setPregunta] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const escuchando = estadoVoz === "escuchando";

  const entorno = useMemo(() => diagnosticarEntornoVoz(), []);
  const avisoEntorno = useMemo(
    () =>
      conVoz
        ? avisoEntornoVoz({
            ...entorno,
            // El soporte se decide por la prop, para no depender del entorno real.
            reconocimientoSoportado: vozSoportada,
          })
        : null,
    [conVoz, entorno, vozSoportada]
  );

  // Si la voz falla, el camino de respaldo es escribir: se resalta y se enfoca
  // el campo de texto para que la persona pueda continuar sin leer menús.
  useEffect(() => {
    if (conVoz && errorVoz) inputRef.current?.focus();
  }, [conVoz, errorVoz]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (pregunta.trim()) {
      onSubmit(pregunta.trim());
    }
  };

  return (
    <div className="buscador">
      {conVoz && (
        <>
          <div className="buscador__voz">
            <VozBoton
              escuchando={escuchando}
              soportado={vozSoportada}
              onClick={onMicrofono}
            />
            <p className="buscador__voz-ayuda" aria-hidden="true">
              {escuchando ? "Te escucho…" : "Toca y háblame"}
            </p>
          </div>

          <div className="buscador__estado" aria-live="polite">
            {escuchando && (
              <p className="buscador__transcripcion">
                {transcripcionVoz || "…"}
              </p>
            )}
            {errorVoz && <p className="error">{errorVoz}</p>}
            {avisoEntorno && (
              <p className="buscador__sin-soporte">{avisoEntorno}</p>
            )}
          </div>
        </>
      )}

      <form onSubmit={handleSubmit} className="consulta-form">
        <input
          ref={inputRef}
          type="text"
          value={pregunta}
          onChange={(e) => setPregunta(e.target.value)}
          placeholder={
            conVoz
              ? "Escribe aquí, o usa el micrófono"
              : "Ej: ¿Qué necesito para sacar licencia clase B?"
          }
          aria-label="Escribe tu consulta sobre un trámite"
          className={
            conVoz && errorVoz ? "consulta-form__input--alerta" : undefined
          }
          disabled={disabled}
        />
        <button type="submit" disabled={disabled || !pregunta.trim()}>
          Consultar
        </button>
      </form>
    </div>
  );
}
