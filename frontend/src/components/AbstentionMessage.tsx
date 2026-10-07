import { CanalDerivacion } from "../types/tramite";

interface Props {
  mensaje: string;
  canal: CanalDerivacion;
}

export default function AbstentionMessage({ mensaje, canal }: Props) {
  return (
    <div className="abstention-message">
      <p>{mensaje}</p>
      <h3>{canal.nombre}</h3>
      <p>{canal.descripcion}</p>
      <a href={canal.url} target="_blank" rel="noreferrer">
        Ir al canal oficial
      </a>
    </div>
  );
}
