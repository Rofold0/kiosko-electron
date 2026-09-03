import { HashRouter, Routes, Route, useNavigate} from "react-router-dom";
import Dashboard from "./pages/dashboard";
import Categorias from "./pages/categorias";
import Subcategorias from "./pages/subcategorias";
import { useEffect } from "react";


function NavegacionElectron() {

  const navigate = useNavigate();


  useEffect(() => {
    // 1. Verificación de seguridad básica
    if (!window.electronAPI || !window.electronAPI.onNavigate) {
      console.warn("Electron API o onNavigate no están disponibles.");
      return;
    }

    const manejarNavegacion = (ruta) => {
      console.log("Navegando desde Electron a:", ruta);
      navigate(ruta);
    };

    // 2. Suscribirse al evento (guarda la función de limpieza si tu API la retorna)
    const removerSuscripcion = window.electronAPI.onNavigate(manejarNavegacion);

    // 3. Limpieza del efecto para evitar fugas de memoria
    return () => {
      if (typeof removerSuscripcion === 'function') {
        removerSuscripcion();
      }
    };
  }, [navigate]);
  return null; // Este componente no necesita renderizar nada
}

function App() {

  return (

    <HashRouter>

      <NavegacionElectron />

      <Routes>

        <Route
          path="/"
          element={<Dashboard />}
        />


        <Route
          path="/categorias"
          element={<Categorias />}
        />
        <Route
          path="/subcategorias"
          element={<Subcategorias />}
        />

      </Routes>

    </HashRouter>

  );
}

export default App;