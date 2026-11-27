import { useCallback, useEffect, useState } from "react";
import LoginPage from "./LoginPage";
import PanelEditor from "./PanelEditor";
import {
  ErrorApi,
  cerrarSesion,
  eliminarTramite,
  guardarTramite,
  iniciarSesion,
  listarTramites,
  quienSoy,
} from "../services/panelApi";
import type { EntradaPanel, FichaPanel, UsuarioPanel } from "../types/panel";

/**
 * Panel de funcionarios (US-05): alta, edición y baja de trámites.
 *
 * Solo se llega aquí con sesión de funcionario; el vecino entra al asistente
 * (ruta `/`) y nunca pide cuenta.
 */

type Estado = "cargando" | "sin-sesion" | "panel";

interface Props {
  onNavegar: (ruta: string) => void;
}

function mensajeDe(error: unknown, porDefecto: string): string {
  if (error instanceof ErrorApi && error.status === 401) return "Tu sesión expiró. Vuelve a iniciar sesión.";
  if (error instanceof ErrorApi) return error.message;
  return porDefecto;
}

function esSesionVencida(error: unknown): boolean {
  return error instanceof ErrorApi && error.status === 401;
}

export default function PanelPage({ onNavegar }: Props) {
  const [estado, setEstado] = useState<Estado>("cargando");
  const [usuario, setUsuario] = useState<UsuarioPanel | null>(null);
  const [origen, setOrigen] = useState<"json" | "praxsuite">("json");
  const [tramites, setTramites] = useState<FichaPanel[]>([]);
  const [cargandoLista, setCargandoLista] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [editor, setEditor] = useState<FichaPanel | null | undefined>(undefined);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [errorLogin, setErrorLogin] = useState<string | null>(null);
  const [entrando, setEntrando] = useState(false);

  const cargarLista = useCallback(async () => {
    try {
      const datos = await listarTramites();
      setTramites(datos.tramites);
      setOrigen(datos.origen);
    } catch (err) {
      if (esSesionVencida(err)) {
        cerrarSesion();
        setEstado("sin-sesion");
      } else {
        setError("No se pudo cargar la lista de trámites. Revisa que el backend esté encendido.");
      }
    } finally {
      setCargandoLista(false);
    }
  }, []);

  // Quién tiene la sesión: si el token venció, se vuelve al login.
  useEffect(() => {
    void (async () => {
      try {
        const { usuario: encontrado } = await quienSoy();
        setUsuario(encontrado);
        setEstado("panel");
      } catch (err) {
        cerrarSesion();
        setEstado("sin-sesion");
        if (!(err instanceof ErrorApi && err.status === 401)) {
          setErrorLogin("No se pudo verificar la sesión. Revisa que el backend esté encendido.");
        }
      }
    })();
  }, []);

  useEffect(() => {
    if (estado === "panel") void cargarLista();
  }, [estado, cargarLista]);

  const manejarLogin = async (email: string, password: string) => {
    setEntrando(true);
    setErrorLogin(null);
    try {
      const { usuario: nuevo } = await iniciarSesion(email, password);
      setUsuario(nuevo);
      setEstado("panel");
    } catch (err) {
      setErrorLogin(mensajeDe(err, "No se pudo conectar con el servidor."));
    } finally {
      setEntrando(false);
    }
  };

  const manejarSalir = () => {
    cerrarSesion();
    setUsuario(null);
    setTramites([]);
    setEditor(undefined);
    setEstado("sin-sesion");
  };

  const manejarGuardar = async (entrada: EntradaPanel) => {
    setGuardando(true);
    setError(null);
    try {
      await guardarTramite(editor?.id ?? null, entrada);
      setEditor(undefined);
      setMensaje("Trámite guardado. Ya aparece en las consultas del vecino.");
      await cargarLista();
    } catch (err) {
      if (esSesionVencida(err)) return manejarSalir();
      setError(mensajeDe(err, "No se pudo guardar el trámite."));
    } finally {
      setGuardando(false);
    }
  };

  const manejarEliminar = async (ficha: FichaPanel) => {
    const seguro = window.confirm(
      `¿Eliminar "${ficha.tramite}"? El vecino dejará de verlo en las consultas.`
    );
    if (!seguro) return;
    setMensaje(null);
    setError(null);
    try {
      await eliminarTramite(ficha.id);
      setMensaje("Trámite eliminado.");
      await cargarLista();
    } catch (err) {
      if (esSesionVencida(err)) return manejarSalir();
      setError(mensajeDe(err, "No se pudo eliminar el trámite."));
    }
  };

  if (estado === "cargando") {
    return (
      <main className="panel">
        <p>Cargando…</p>
      </main>
    );
  }

  if (estado === "sin-sesion") {
    return <LoginPage error={errorLogin} cargando={entrando} onLogin={manejarLogin} />;
  }

  const visibles = tramites.filter((f) =>
    f.tramite.toLowerCase().includes(busqueda.trim().toLowerCase())
  );

  return (
    <main className="panel">
      <header className="panel__cabecera">
        <div>
          <h1>Panel de funcionarios</h1>
          <p className="subtitulo">
            {usuario?.nombre} · datos desde{" "}
            {origen === "praxsuite" ? "Praxsuite" : "los JSON locales"}
          </p>
        </div>
        <div className="panel__acciones-cabecera">
          <button type="button" className="boton-secundario" onClick={() => onNavegar("/")}>
            Ir al asistente
          </button>
          <button type="button" className="boton-secundario" onClick={manejarSalir}>
            Cerrar sesión
          </button>
        </div>
      </header>

      {mensaje && (
        <p className="panel__mensaje" role="status">
          {mensaje}
        </p>
      )}
      {error && (
        <p className="panel-login__error" role="alert">
          {error}
        </p>
      )}

      {editor !== undefined ? (
        <PanelEditor
          ficha={editor}
          guardando={guardando}
          error={error}
          onGuardar={manejarGuardar}
          onCancelar={() => {
            setEditor(undefined);
            setError(null);
          }}
        />
      ) : (
        <>
          <div className="panel__barra">
            <label className="campo campo--busqueda">
              <span>Buscar trámite</span>
              <input
                type="search"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="licencia, permiso, taller…"
              />
            </label>
            <button
              type="button"
              className="boton-principal"
              onClick={() => {
                setError(null);
                setEditor(null);
              }}
            >
              Nuevo trámite
            </button>
          </div>

          {cargandoLista && <p>Cargando trámites…</p>}

          {!cargandoLista && visibles.length === 0 && (
            <p>No hay trámites que coincidan con la búsqueda.</p>
          )}

          <ul className="panel-lista">
            {visibles.map((ficha) => (
              <li key={ficha.id} className="panel-lista__item">
                <div className="panel-lista__info">
                  <strong>{ficha.tramite}</strong>
                  <span className="panel-lista__meta">
                    {ficha.tipo === "catalogo"
                      ? "Catálogo · solo enlace"
                      : `Ficha completa · ${ficha.requisitos.length} requisitos · ${ficha.pasos.length} pasos`}
                  </span>
                </div>
                <div className="panel-lista__acciones">
                  <button
                    type="button"
                    className="boton-secundario"
                    onClick={() => {
                      setError(null);
                      setEditor(ficha);
                    }}
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    className="boton-peligro"
                    onClick={() => void manejarEliminar(ficha)}
                  >
                    Eliminar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </main>
  );
}
