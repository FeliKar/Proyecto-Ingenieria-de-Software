import { useState, type FormEvent } from "react";

/**
 * Login del funcionario (US-05).
 *
 * Es una pantalla para el municipio, no para el vecino: el asistente nunca
 * pide cuenta. Por eso no tiene voz ni modo accesibilidad, solo formulario.
 */

interface Props {
  error: string | null;
  cargando: boolean;
  onLogin: (email: string, password: string) => void;
}

export default function LoginPage({ error, cargando, onLogin }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!email.trim() || !password) return;
    onLogin(email.trim(), password);
  };

  return (
    <main className="panel">
      <header className="panel__cabecera">
        <div>
          <h1>Panel de funcionarios</h1>
          <p className="subtitulo">Municipalidad de Peñalolén · MuniChat</p>
        </div>
        <a className="panel__volver" href="/">
          Volver al asistente
        </a>
      </header>

      <form className="panel-login" onSubmit={handleSubmit}>
        <h2>Iniciar sesión</h2>
        <p className="panel-login__ayuda">
          Entra con tu usuario municipal para actualizar el catálogo de
          trámites. Los vecinos no necesitan cuenta para consultar.
        </p>

        <label className="campo">
          <span>Correo</span>
          <input
            type="email"
            name="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="funcionario@munichat.cl"
            required
          />
        </label>

        <label className="campo">
          <span>Contraseña</span>
          <input
            type="password"
            name="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>

        {error && (
          <p className="panel-login__error" role="alert">
            {error}
          </p>
        )}

        <button type="submit" className="boton-principal" disabled={cargando}>
          {cargando ? "Entrando…" : "Entrar al panel"}
        </button>
      </form>
    </main>
  );
}
