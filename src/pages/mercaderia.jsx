import DashboardCard
    from "../components/dashboardCard.jsx";

import { ROUTES }
    from "../../shared/routes.js";
import PageHeader
    from "../components/pageHeader.jsx";
function Mercaderia() {
    return (
        <div className="page">
            <PageHeader
                title="Mercaderia"
            />
            <div className="dashboard-grid">
                <DashboardCard
                    title="Productos"
                    onClick={() =>
                        navigate(
                            ROUTES.productos
                        )
                    }
                />


                <DashboardCard
                    title="Stock"
                    onClick={() =>
                        navigate(
                            ROUTES.stock
                        )
                    }
                />


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
                <DashboardCard
                    title="Lista de compras"
                    onClick={() =>
                        navigate(
                            ROUTES.listaCompras
                        )
                    }
                />

            </div>
        </div>
    );
}
export default Mercaderia;