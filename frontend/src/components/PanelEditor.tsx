import { useState, type FormEvent } from "react";
import type { EntradaPanel, FichaPanel } from "../types/panel";

/**
 * Formulario de alta y edición de un trámite (US-05).
 *
 * Requisitos, pasos y alias se escriben uno por línea: es la forma más simple
 * de editar listas largas sin librerías. El catálogo solo admite nombre y
 * enlace (US-09), así que el resto de los campos se oculta.
 */

interface Props {
  ficha: FichaPanel | null; // null = trámite nuevo
  guardando: boolean;
  error: string | null;
  onGuardar: (entrada: EntradaPanel) => void;
  onCancelar: () => void;
}

function lineas(texto: string): string[] {
  return texto
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
}

export default function PanelEditor({
  ficha,
  guardando,
  error,
  onGuardar,
  onCancelar,
}: Props) {
  const esNuevo = ficha === null;
  const [tramite, setTramite] = useState(ficha?.tramite ?? "");
  const [tipo, setTipo] = useState<"completa" | "catalogo">(
    ficha?.tipo ?? "completa"
  );
  const [enlace, setEnlace] = useState(ficha?.enlace_oficial ?? "");
  const [vigencia, setVigencia] = useState(ficha?.vigencia ?? "");
  const [requisitos, setRequisitos] = useState(
    (ficha?.requisitos ?? []).join("\n")
  );
  const [pasos, setPasos] = useState((ficha?.pasos ?? []).join("\n"));
  const [alias, setAlias] = useState((ficha?.alias ?? []).join("\n"));

  const soloEnlace = tipo === "catalogo";

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    onGuardar({
      ...(esNuevo || !ficha ? {} : { id: ficha.id }),
      tramite: tramite.trim(),
      tipo,
      enlace_oficial: enlace.trim(),
      ...(soloEnlace
        ? {}
        : {
            vigencia: vigencia.trim(),
            requisitos: lineas(requisitos),
            pasos: lineas(pasos),
            alias: lineas(alias),
          }),
    });
  };

  return (
    <form className="panel-editor" onSubmit={handleSubmit}>
      <h2>{esNuevo ? "Nuevo trámite" : `Editando: ${ficha?.tramite}`}</h2>

      <label className="campo">
        <span>Nombre del trámite</span>
        <input
          type="text"
          value={tramite}
          onChange={(e) => setTramite(e.target.value)}
          required
        />
      </label>

      <label className="campo">
        <span>Tipo</span>
        <select
          value={tipo}
          onChange={(e) => setTipo(e.target.value as "completa" | "catalogo")}
        >
          <option value="completa">Ficha completa (con requisitos y pasos)</option>
          <option value="catalogo">Catálogo (solo nombre y enlace)</option>
        </select>
      </label>

      <label className="campo">
        <span>Enlace oficial (https://)</span>
        <input
          type="url"
          value={enlace}
          onChange={(e) => setEnlace(e.target.value)}
          placeholder="https://tramites.penalolen.cl/Tramites/ver/..."
          required
        />
      </label>

      {soloEnlace ? (
        <p className="panel-editor__aviso" role="note">
          Un trámite del catálogo nunca lleva requisitos, pasos ni vigencia:
          esa información vive en el sitio del municipio (US-09).
        </p>
      ) : (
        <>
          <label className="campo">
            <span>Vigencia</span>
            <input
              type="text"
              value={vigencia}
              onChange={(e) => setVigencia(e.target.value)}
              placeholder="6 años desde su emisión."
            />
          </label>

          <label className="campo">
            <span>Requisitos (uno por línea)</span>
            <textarea
              rows={4}
              value={requisitos}
              onChange={(e) => setRequisitos(e.target.value)}
              placeholder={"Cédula de identidad vigente."}
            />
          </label>

          <label className="campo">
            <span>Pasos (uno por línea)</span>
            <textarea
              rows={4}
              value={pasos}
              onChange={(e) => setPasos(e.target.value)}
              placeholder={"Inscribirse en la dirección correspondiente."}
            />
          </label>

          <label className="campo">
            <span>Alias para la búsqueda (uno por línea)</span>
            <textarea
              rows={3}
              value={alias}
              onChange={(e) => setAlias(e.target.value)}
              placeholder={"sacar licencia clase b"}
            />
          </label>
        </>
      )}

      {error && (
        <p className="panel-login__error" role="alert">
          {error}
        </p>
      )}

      <div className="panel-editor__acciones">
        <button type="submit" className="boton-principal" disabled={guardando}>
          {guardando ? "Guardando…" : "Guardar"}
        </button>
        <button type="button" className="boton-secundario" onClick={onCancelar}>
          Cancelar
        </button>
      </div>
    </form>
  );
}
