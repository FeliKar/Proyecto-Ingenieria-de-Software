import type { CanalDerivacion } from "../types/tramite";

interface Props {
  mensaje: string;
  canal: CanalDerivacion;
  opciones?: { id: string; tramite: string }[];
  onElegirOpcion?: (id: string) => void;
}

export default function AbstentionMessage({
  mensaje,
  canal,
  opciones,
  onElegirOpcion,
}: Props) {
  return (
    <div className="abstention-message">
      <p>{mensaje}</p>
      <h3>{canal.nombre}</h3>
      <p>{canal.descripcion}</p>
      <a href={canal.url} target="_blank" rel="noreferrer">
        Ir al canal oficial
      </a>
      {opciones && opciones.length > 0 && (
        <div className="opciones">
          <p>¿Cuál de estos trámites necesitas?</p>
          {opciones.map((opcion) => (
            <button
              key={opcion.id}
              type="button"
              onClick={() => onElegirOpcion?.(opcion.id)}
            >
              {opcion.tramite}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
