import {
    useNavigate
} from "react-router-dom";

import {
    useAuth
} from "../auth/authContext.jsx";
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
                <DashboardCard
                    title="Proveedores"
                    onClick={() =>
                        navigate(
                            ROUTES.proveedores
                        )
                    }
                />
                <DashboardCard
                    title="Compras"
                    onClick={() =>
                        navigate(
                            ROUTES.compras
                        )
                    }
                />
                <DashboardCard
                    title="Precios"
                    onClick={() =>
                        navigate(
                            ROUTES.precios
                        )
                    }
                />
                <DashboardCard
                    title="Ventas"
                    onClick={() =>
                        navigate(
                            ROUTES.ventas
                        )
                    }
                />
                <DashboardCard
                    title="Caja"
                    onClick={() =>
                        navigate(
                            ROUTES.caja
                        )
                    }
                />
                <DashboardCard
                    title="Gastos"
                    onClick={() =>
                        navigate(
                            ROUTES.gastos
                        )
                    }
                />
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