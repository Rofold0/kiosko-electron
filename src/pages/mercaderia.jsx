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
function Mercaderia() {
    const navigate =
        useNavigate();

    const {
        puede
    } =
        useAuth();
    return (
        <div className="page">
            <PageHeader
                title="Mercaderia"
            />
            <div className="dashboard-grid">
                {puede(
                    "productos.ver"
                ) && (

                        <DashboardCard
                            title="Productos"
                            onClick={() =>
                                navigate(
                                    ROUTES.productos
                                )
                            }
                        />

                    )}


                {puede(
                    "stock.ver"
                ) && (

                        <DashboardCard
                            title="Stock"
                            onClick={() =>
                                navigate(
                                    ROUTES.stock
                                )
                            }
                        />

                    )}


                {puede(
                    "categorias.ver"
                ) && (

                        <>
                            <DashboardCard
                                title="Categorías"
                                onClick={() =>
                                    navigate(
                                        ROUTES.categorias
                                    )
                                }
                            />

                            <DashboardCard
                                title="Subcategorías"
                                onClick={() =>
                                    navigate(
                                        ROUTES.subcategorias
                                    )
                                }
                            />
                        </>

                    )}


                {puede(
                    "lista_compras.ver"
                ) && (

                        <DashboardCard
                            title="Lista de compras"
                            onClick={() =>
                                navigate(
                                    ROUTES.listaCompras
                                )
                            }
                        />

                    )}

            </div>
        </div>
    );
}
export default Mercaderia;