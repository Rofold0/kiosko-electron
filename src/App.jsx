import { HashRouter, Routes, Route, useNavigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./auth/authContext.jsx";
import Login from "./pages/login.jsx";
import ConfiguracionInicial from "./pages/configuracionInicial.jsx";
import Usuarios from "./pages/usuarios.jsx";
import RutaProtegida from "./auth/rutaProtegida.jsx";
import Dashboard from "./pages/dashboard";
import Categorias from "./pages/categorias";
import Subcategorias from "./pages/subcategorias";
import { useEffect } from "react";
import { ROUTES } from "../shared/routes.js";
import Productos from "./pages/productos";
import Stock from "./pages/stock";
import ListaCompras from "./pages/listaCompras";
import Proveedores from "./pages/proveedores";
import Compras from "./pages/compras";
import Precios from "./pages/precios";
import Ventas from "./pages/ventas";
import Caja from "./pages/caja";
import Gastos from "./pages/gastos";
import Reportes from "./pages/reportes";
import Mercaderia from "./pages/mercaderia";
import Gestion from "./pages/gestion";
import Auditoria from "./pages/auditoria.jsx";


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

function AplicacionProtegida() {

  const {
    logout,
    puede
  } =
    useAuth();


  return (
    <>

      <NavegacionElectron />


      <div className="app-session-bar">

        <span>
          Sesión activa
        </span>

        <button
          type="button"
          onClick={logout}
        >
          Cerrar sesión
        </button>

      </div>


      <Routes>

        <Route
          path={ROUTES.dashboard}
          element={<Dashboard />}
        />

        <Route
          path={ROUTES.categorias}
          element={
            <RutaProtegida
              permisos="categorias.ver"
            >
              <Categorias />
            </RutaProtegida>
          }
        />


        <Route
          path={ROUTES.subcategorias}
          element={
            <RutaProtegida
              permisos="categorias.ver"
            >
              <Subcategorias />
            </RutaProtegida>
          }
        />


        <Route
          path={ROUTES.productos}
          element={
            <RutaProtegida
              permisos="productos.ver"
            >
              <Productos />
            </RutaProtegida>
          }
        />


        <Route
          path={ROUTES.stock}
          element={
            <RutaProtegida
              permisos="stock.ver"
            >
              <Stock />
            </RutaProtegida>
          }
        />


        <Route
          path={ROUTES.listaCompras}
          element={
            <RutaProtegida
              permisos="lista_compras.ver"
            >
              <ListaCompras />
            </RutaProtegida>
          }
        />


        <Route
          path={ROUTES.proveedores}
          element={
            <RutaProtegida
              permisos="proveedores.ver"
            >
              <Proveedores />
            </RutaProtegida>
          }
        />


        <Route
          path={ROUTES.compras}
          element={
            <RutaProtegida
              permisos={[
                "compras.ver",
                "compras.crear"
              ]}
            >
              <Compras />
            </RutaProtegida>
          }
        />


        <Route
          path={ROUTES.precios}
          element={
            <RutaProtegida
              permisos="precios.ver"
            >
              <Precios />
            </RutaProtegida>
          }
        />


        <Route
          path={ROUTES.ventas}
          element={
            <RutaProtegida
              permisos={[
                "ventas.ver",
                "ventas.crear"
              ]}
            >
              <Ventas />
            </RutaProtegida>
          }
        />


        <Route
          path={ROUTES.caja}
          element={
            <RutaProtegida
              permisos="caja.ver"
            >
              <Caja />
            </RutaProtegida>
          }
        />


        <Route
          path={ROUTES.gastos}
          element={
            <RutaProtegida
              permisos="gastos.ver"
            >
              <Gastos />
            </RutaProtegida>
          }
        />


        <Route
          path={ROUTES.reportes}
          element={
            <RutaProtegida
              permisos="reportes.ver"
            >
              <Reportes />
            </RutaProtegida>
          }
        />


        <Route
          path={ROUTES.usuarios}
          element={
            <RutaProtegida
              permisos="usuarios.ver"
            >
              <Usuarios />
            </RutaProtegida>
          }
        />

        <Route
          path={ROUTES.mercaderia}
          element={
            <RutaProtegida
              permisos={[
                "productos.ver",
                "productos.modificar",
                "stock.ver",
                "stock.ajustar",
                "categorias.ver",
                "categorias.modificar",
                "lista_compras.ver",
                "lista_compras.modificar"
              ]}
            >
              <Mercaderia />
            </RutaProtegida>
          }
        />


        <Route
          path={ROUTES.gestion}
          element={
            <RutaProtegida
              permisos={[
                "proveedores.ver",
                "proveedores.modificar",
                "compras.ver",
                "compras.crear",
                "compras.revertir",
                "precios.ver",
                "precios.modificar",
                "ventas.ver",
                "ventas.crear",
                "ventas.revertir",
                "caja.ver",
                "gastos.ver",
                "gastos.crear",
                "gastos.revertir",
                "usuarios.ver"
              ]}
            >
              <Gestion />
            </RutaProtegida>
          }
        />

        <Route
          path={ROUTES.auditoria}
          element={
            <RutaProtegida
              permisos="auditoria.ver"
            >
              <Auditoria />
            </RutaProtegida>
          }
        />
        <Route
          path="*"
          element={<Dashboard />}
        />

      </Routes>

    </>
  );

}


function ContenidoApp() {

  const {
    cargando,
    usuario,
    requiereConfiguracion
  } =
    useAuth();


  if (cargando) {

    return (
      <div className="auth-loading">
        Cargando...
      </div>
    );

  }


  if (requiereConfiguracion) {

    return (
      <ConfiguracionInicial />
    );

  }


  if (!usuario) {

    return (
      <Login />
    );

  }


  return (
    <AplicacionProtegida />
  );

}


function App() {

  return (

    <HashRouter>

      <AuthProvider>

        <ContenidoApp />

      </AuthProvider>

    </HashRouter>

  );

}

export default App;