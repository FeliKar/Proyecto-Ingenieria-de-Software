import type { UsuarioPanel } from "../types/panel";

/**
 * Administración de usuarios del panel (ADR-05).
 *
 * Solo la ve un `admin`. El selector cambia el rol en la fuente activa
 * (Praxsuite o JSON); nadie puede cambiar el rol de la fila de su propia
 * cuenta, para que el equipo nunca se quede sin administradores.
 */

interface Props {
  usuarios: UsuarioPanel[];
  idSesion: string;
  actualizando: string | null;
  error: string | null;
  onCambioRol: (id: string, rol: "admin" | "funcionario") => void;
}

export default function PanelUsuarios({
  usuarios,
  idSesion,
  actualizando,
  error,
  onCambioRol,
}: Props) {
  return (
    <section className="panel-usuarios" aria-label="Funcionarios">
      <h2>Funcionarios</h2>
      <p className="panel-login__ayuda">
        El rol <strong>admin</strong> puede borrar trámites y administrar
        usuarios; el rol <strong>funcionario</strong> solo crea y edita
        trámites.
      </p>

      {error && (
        <p className="panel-login__error" role="alert">
          {error}
        </p>
      )}

      <ul className="panel-lista">
        {usuarios.map((usuario) => {
          const esPropio = usuario.id === idSesion;
          const ocupado = actualizando === usuario.id;
          return (
            <li key={usuario.id} className="panel-lista__item">
              <div className="panel-lista__info">
                <strong>{usuario.nombre}</strong>
                <span className="panel-lista__meta">
                  {usuario.email}
                  {esPropio ? " · tú" : ""}
                </span>
              </div>
              <label className="campo campo--rol">
                <span>Rol</span>
                <select
                  value={usuario.rol}
                  disabled={esPropio || ocupado}
                  onChange={(e) =>
                    onCambioRol(
                      usuario.id,
                      e.target.value as "admin" | "funcionario"
                    )
                  }
                  aria-label={`Rol de ${usuario.nombre}`}
                >
                  <option value="funcionario">funcionario</option>
                  <option value="admin">admin</option>
                </select>
              </label>
            </li>
          );
        })}
      </ul>

      {usuarios.length === 0 && <p>No hay funcionarios registrados.</p>}
    </section>
  );
}
