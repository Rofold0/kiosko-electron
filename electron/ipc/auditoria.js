import {
    handleProtegido
} from "../security/ipcPermissions.js";

import {
    listarAuditoria
} from "../database/repositories/auditoriaRepository.js";


const PATRON_FECHA =
    /^\d{4}-\d{2}-\d{2}$/;


function convertirFecha(
    valor,
    fin = false
) {

    if (!valor) {
        return null;
    }


    if (
        !PATRON_FECHA.test(
            valor
        )
    ) {

        throw new Error(
            "Fecha inválida."
        );

    }


    const [
        anio,
        mes,
        dia
    ] =
        valor
            .split("-")
            .map(Number);


    const fecha =
        new Date(

            anio,
            mes - 1,
            dia,

            0,
            0,
            0,
            0

        );


    if (fin) {

        fecha.setDate(
            fecha.getDate() +
            1
        );

    }


    return fecha
        .toISOString();

}


export function registerAuditoriaHandlers() {

    handleProtegido(
        "auditoria:listar",

        (
            _event,
            filtros = {}
        ) => {

            const pagina =
                Math.max(
                    1,
                    Number(
                        filtros.pagina
                    ) || 1
                );


            const limite =
                Math.min(
                    100,
                    Math.max(
                        1,
                        Number(
                            filtros.limite
                        ) || 50
                    )
                );


            const usuarioId =
                filtros.usuario_id
                    ? Number(
                        filtros.usuario_id
                    )
                    : null;


            if (
                usuarioId !== null &&
                (
                    !Number.isInteger(
                        usuarioId
                    ) ||
                    usuarioId <= 0
                )
            ) {

                throw new Error(
                    "Usuario inválido."
                );

            }


            const resultado =
                listarAuditoria({

                    modulo:
                        filtros.modulo
                            ?.trim()
                            ?.toUpperCase() ||
                        null,

                    usuarioId,

                    desde:
                        convertirFecha(
                            filtros.desde
                        ),

                    hasta:
                        convertirFecha(
                            filtros.hasta,
                            true
                        ),

                    limite,

                    offset:
                        (
                            pagina - 1
                        ) *
                        limite

                });


            return {

                ...resultado,

                pagina,

                limite,

                totalPaginas:
                    Math.max(
                        1,
                        Math.ceil(
                            resultado.total /
                            limite
                        )
                    )

            };

        }
    );

}