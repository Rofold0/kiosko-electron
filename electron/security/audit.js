import {
    exigirSesion
} from "./session.js";

import {
    registrarAuditoria
} from "../database/repositories/auditoriaRepository.js";


export function auditar(
    event,
    datos
) {

    const sesion =
        exigirSesion(
            event
        );


    try {

        registrarAuditoria({

            usuarioId:
                sesion.id,

            usuario:
                sesion.usuario,

            usuarioNombre:
                sesion.nombre,

            ...datos

        });


    } catch (error) {

        /*
         * Una venta/compra no debe quedar
         * registrada correctamente y después
         * mostrarle al usuario que "falló"
         * únicamente porque falló auditoría.
         *
         * Por ahora registramos el problema
         * en consola.
         */

        console.error(
            "Error registrando auditoría:",
            error
        );

    }

}