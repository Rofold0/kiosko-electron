import {
    Navigate
} from "react-router-dom";

import {
    useAuth
} from "./authContext.jsx";

import {
    ROUTES
} from "../../shared/routes.js";


function RutaProtegida({
    permisos,
    children
}) {

    const {
        puede
    } =
        useAuth();


    const requeridos =
        Array.isArray(
            permisos
        )
            ? permisos
            : [permisos];


    /*
     * Basta con tener uno de los
     * permisos solicitados.
     */

    const autorizado =
        requeridos.some(
            (permiso) =>
                puede(
                    permiso
                )
        );


    if (!autorizado) {

        return (
            <Navigate
                to={
                    ROUTES.dashboard
                }
                replace
            />
        );

    }


    return children;

}


export default RutaProtegida;