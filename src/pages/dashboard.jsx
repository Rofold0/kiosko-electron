import { useNavigate }
    from "react-router-dom";

import DashboardCard
    from "../components/dashboardCard.jsx";

import { ROUTES }
    from "../../shared/routes.js";


function Dashboard() {

    const navigate = useNavigate();


    return (

        <div className="page">

            <h1>Kiosko</h1>


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
                    title="Stock"
                    onClick={() =>
                        navigate(
                            ROUTES.stock
                        )
                    }
                />

            </div>

        </div>

    );

}


export default Dashboard;