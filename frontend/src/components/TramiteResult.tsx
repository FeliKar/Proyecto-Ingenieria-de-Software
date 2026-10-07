import { FichaTramite } from "../types/tramite";

interface Props {
  ficha: FichaTramite;
}

export default function TramiteResult({ ficha }: Props) {
  return (
    <div className="tramite-result">
      <h2>{ficha.tramite}</h2>

      <h3>Requisitos</h3>
      <ul>
        {ficha.requisitos.map((r, i) => (
          <li key={i}>{r}</li>
        ))}
      </ul>

      <h3>Pasos</h3>
      <ol>
        {ficha.pasos.map((p, i) => (
          <li key={i}>{p}</li>
        ))}
      </ol>

      <h3>Vigencia</h3>
      <p>{ficha.vigencia}</p>

      <a href={ficha.enlace_oficial} target="_blank" rel="noreferrer">
        Ver información oficial
      </a>
    </div>
  );
}
