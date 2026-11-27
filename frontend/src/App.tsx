import { useEffect, useState } from "react";
import "./App.css";
import ChatApp from "./components/ChatApp";
import PanelPage from "./components/PanelPage";

/**
 * Rutas de MuniChat (sin dependencias de router):
 *
 *   /        asistente para el vecino (sin sesión)
 *   /panel   panel de funcionarios (sesión, US-05)
 *
 * La navegación usa History API para no recargar la página; `popstate`
 * mantiene el estado al usar el botón "atrás" del navegador.
 */
function rutaActual(): string {
  return window.location.pathname.startsWith("/panel") ? "/panel" : "/";
}

function App() {
  const [ruta, setRuta] = useState<string>(rutaActual);

  useEffect(() => {
    const alVolver = () => setRuta(rutaActual());
    window.addEventListener("popstate", alVolver);
    return () => window.removeEventListener("popstate", alVolver);
  }, []);

  const navegar = (destino: string) => {
    window.history.pushState({}, "", destino);
    setRuta(destino);
  };

  return ruta === "/panel" ? (
    <PanelPage onNavegar={navegar} />
  ) : (
    <ChatApp onNavegar={navegar} />
  );
}

export default App;
