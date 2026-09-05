import { useNavigate }
    from "react-router-dom";

import { ROUTES }
    from "../../shared/routes.js";


function PageHeader({ title }) {

    const navigate = useNavigate();


    const volverAlDashboard = () => {

        navigate(
            ROUTES.dashboard
        );

    };


    return (

        <div className="page-header">

            <button
                type="button"
                onClick={
                    volverAlDashboard
                }
            >
                ← Volver
            </button>


            <h1>
                {title}
            </h1>

        </div>

    );

}


export default PageHeader;