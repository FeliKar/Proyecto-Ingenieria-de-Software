interface Props {
  transcripcion: string;
  onBuscar: () => void;
  onHablarOtraVez: () => void;
  onEscucharDeNuevo: () => void;
  disabled?: boolean;
}

// Pantalla de confirmación después de hablar: se lee lo escuchado y se ofrece
// actuar solo con botones grandes, sin necesidad de leer ni escribir.
export default function ConfirmacionVoz({
  transcripcion,
  onBuscar,
  onHablarOtraVez,
  onEscucharDeNuevo,
  disabled,
}: Props) {
  return (
    <section className="confirmacion-voz" aria-label="Confirmar lo que escuché">
      <p className="confirmacion-voz__titulo">
        Escuché esto. ¿Está correcto?
      </p>

      <p className="confirmacion-voz__texto" lang="es">
        “{transcripcion}”
      </p>

      <div className="confirmacion-voz__acciones">
        <button
          type="button"
          className="boton-grande boton-grande--primario"
          onClick={onBuscar}
          disabled={disabled || !transcripcion.trim()}
        >
          <span aria-hidden="true">🔍</span> Buscar este trámite
        </button>

        <button
          type="button"
          className="boton-grande"
          onClick={onHablarOtraVez}
          disabled={disabled}
        >
          <span aria-hidden="true">🎤</span> Hablar otra vez
        </button>

        <button
          type="button"
          className="boton-grande"
          onClick={onEscucharDeNuevo}
          disabled={disabled}
        >
          <span aria-hidden="true">🔁</span> Escuchar de nuevo
        </button>
      </div>
    </section>
  );
}
