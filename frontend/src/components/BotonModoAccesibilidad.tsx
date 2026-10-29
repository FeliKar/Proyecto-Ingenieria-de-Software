interface Props {
  activo: boolean;
  onToggle: () => void;
}

// Activa o desactiva el modo accesibilidad (micrófono + lectura en voz alta).
// Por defecto la página opera normal, sin voz.
export default function BotonModoAccesibilidad({ activo, onToggle }: Props) {
  return (
    <button
      type="button"
      className={`modo-accesibilidad ${activo ? "modo-accesibilidad--activo" : ""}`}
      onClick={onToggle}
      aria-pressed={activo}
      aria-label="Modo accesibilidad: hablar y escuchar los trámites"
    >
      <span aria-hidden="true">{activo ? "🔊" : "🔈"}</span>
      Modo accesibilidad
    </button>
  );
}
