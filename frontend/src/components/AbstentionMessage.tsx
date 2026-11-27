import type { CanalDerivacion } from "../types/tramite";

interface Props {
  mensaje: string;
  canal: CanalDerivacion;
  opciones?: { id: string; tramite: string }[];
  onElegirOpcion?: (id: string) => void;
}

/** Enlace `tel:`: conserva el prefijo + y los dígitos, quita espacios y guiones. */
export function telefonoHref(telefono: string): string {
  return `tel:${telefono.replace(/[^\d+]/g, "")}`;
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
      <div className="abstention-message__canales">
        <a href={canal.url} target="_blank" rel="noopener noreferrer">
          Ir al canal oficial
        </a>
        {canal.telefono && (
          <a className="abstention-message__telefono" href={telefonoHref(canal.telefono)}>
            Llamar al {canal.telefono}
          </a>
        )}
      </div>
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
