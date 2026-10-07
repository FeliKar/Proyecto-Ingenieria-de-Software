import { useState, FormEvent } from "react";

interface Props {
  onSubmit: (pregunta: string) => void;
  disabled?: boolean;
}

export default function ConsultaForm({ onSubmit, disabled }: Props) {
  const [pregunta, setPregunta] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (pregunta.trim()) {
      onSubmit(pregunta.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="consulta-form">
      <input
        type="text"
        value={pregunta}
        onChange={(e) => setPregunta(e.target.value)}
        placeholder="Ej: ¿Qué necesito para sacar licencia clase B?"
        disabled={disabled}
      />
      <button type="submit" disabled={disabled || !pregunta.trim()}>
        Consultar
      </button>
    </form>
  );
}
