interface Props {
  escuchando: boolean;
  soportado: boolean;
  onClick: () => void;
}

// Botón de micrófono grande (círculo de 80px) con ícono, sin depender de leer texto.
// Cuando está escuchando, cambia a ícono de detener y late con un anillo rojo.
export default function VozBoton({ escuchando, soportado, onClick }: Props) {
  return (
    <button
      type="button"
      className={`voz-boton ${escuchando ? "voz-boton--escuchando" : ""}`}
      onClick={onClick}
      disabled={!soportado}
      aria-label={
        escuchando ? "Dejar de escuchar" : "Hablar para buscar un trámite"
      }
      title={
        escuchando ? "Dejar de escuchar" : "Hablar para buscar un trámite"
      }
    >
      <span className="voz-boton__anillo" aria-hidden="true" />
      {escuchando ? (
        <svg
          viewBox="0 0 24 24"
          width="40"
          height="40"
          aria-hidden="true"
          focusable="false"
        >
          <rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" />
        </svg>
      ) : (
        <svg
          viewBox="0 0 24 24"
          width="40"
          height="40"
          aria-hidden="true"
          focusable="false"
        >
          <path
            fill="currentColor"
            d="M12 15a3.5 3.5 0 0 0 3.5-3.5v-5a3.5 3.5 0 1 0-7 0v5A3.5 3.5 0 0 0 12 15Zm6-3.5a6 6 0 0 1-12 0H4.5a7.5 7.5 0 0 0 6.75 7.46V21h1.5v-2.04A7.5 7.5 0 0 0 19.5 11.5H18Z"
          />
        </svg>
      )}
    </button>
  );
}
