import { useNavigate }
    from "react-router-dom";

import { ROUTES }
    from "../../shared/routes.js";


function PageHeader({ title, mostrarAtras=true, mostrarDashboard=true }) {

    const navigate = useNavigate();

    const volverAtras = () => {

        if (window.history.length > 1) {
            navigate(-1);
            return;
        }
        navigate(
            ROUTES.dashboard
        );

    };


    const volverAlDashboard = () => {

        navigate(ROUTES.dashboard);
    };


    return (

        <div className="page-header">

            <div className="page-header-actions">

                {mostrarAtras && (

                    <button
                        type="button"
                        onClick={
                            volverAtras
                        }
                    >
                        ← Atrás
                    </button>

                )}


                {mostrarDashboard && (

                    <button
                        type="button"
                        onClick={
                            volverAlDashboard
                        }
                    >
                        ⌂ Dashboard
                    </button>

                )}

            </div>


            <h1>
                {title}
            </h1>

        </div>

    );

}


export default PageHeader;