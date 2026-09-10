import {
    useAuth
} from "../auth/authContext.jsx";
import {
    useNavigate
} from "react-router-dom";
import DashboardCard
    from "../components/dashboardCard.jsx";
import { ROUTES }
    from "../../shared/routes.js";
import PageHeader
    from "../components/pageHeader.jsx";

function Gestion() {
    const navigate =
        useNavigate();


    const {
        puede
    } =
        useAuth();

    return (
        <div className="page">
            <PageHeader
                title="Gestión"
            />
            <div className="dashboard-grid">
                {puede(
                    "proveedores.ver"
                ) && (
                        <DashboardCard
                            title="Proveedores"
                            onClick={() =>
                                navigate(
                                    ROUTES.proveedores
                                )
                            }
                        />
                    )}


                {(
                    puede("compras.ver") ||
                    puede("compras.crear")
                ) && (
                        <DashboardCard
                            title="Compras"
                            onClick={() =>
                                navigate(
                                    ROUTES.compras
                                )
                            }
                        />
                    )}


                {puede(
                    "precios.ver"
                ) && (
                        <DashboardCard
                            title="Precios"
                            onClick={() =>
                                navigate(
                                    ROUTES.precios
                                )
                            }
                        />
                    )}


                {(
                    puede("ventas.ver") ||
                    puede("ventas.crear")
                ) && (
                        <DashboardCard
                            title="Ventas"
                            onClick={() =>
                                navigate(
                                    ROUTES.ventas
                                )
                            }
                        />
                    )}


                {puede(
                    "caja.ver"
                ) && (
                        <DashboardCard
                            title="Caja"
                            onClick={() =>
                                navigate(
                                    ROUTES.caja
                                )
                            }
                        />
                    )}


                {puede(
                    "gastos.ver"
                ) && (
                        <DashboardCard
                            title="Gastos"
                            onClick={() =>
                                navigate(
                                    ROUTES.gastos
                                )
                            }
                        />
                    )}


                {puede(
                    "usuarios.ver"
                ) && (
                        <DashboardCard
                            title="Usuarios"
                            onClick={() =>
                                navigate(
                                    ROUTES.usuarios
                                )
                            }
                        />
                    )}

            </div>
        </div>
    );
}
export default Gestion;