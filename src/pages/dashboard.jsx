import { useNavigate }
    from "react-router-dom";

import { ROUTES }
    from "../../shared/routes.js";

function Dashboard() {

    const navigate = useNavigate();

    return (
        <div>

            <h1>Kiosko</h1>

            <button
                onClick={() =>
                    navigate(
                        ROUTES.categorias
                    )
                }
            >
                Categorías
            </button>

            <button
                onClick={() =>
                    navigate(
                        ROUTES.subcategorias
                    )
                }
            >
                Subcategorías
            </button>

        </div>
    );
}

export default Dashboard;