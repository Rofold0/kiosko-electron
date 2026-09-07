import {
    ipcMain
} from "electron";

import {
    obtenerDashboardReportes
} from "../database/repositories/reportesRepository.js";


const PATRON_FECHA =
    /^\d{4}-\d{2}-\d{2}$/;


function fechaLocal(
    texto
) {

    if (
        !PATRON_FECHA.test(
            texto || ""
        )
    ) {

        throw new Error(
            "Fecha inválida."
        );

    }


    const fecha =
        new Date(
            `${texto}T00:00:00`
        );


    if (
        Number.isNaN(
            fecha.getTime()
        )
    ) {

        throw new Error(
            "Fecha inválida."
        );

    }


    return fecha;

}


function fechaTextoLocal(
    fecha
) {

    const year =
        fecha.getFullYear();


    const month =
        String(
            fecha.getMonth() + 1
        )
            .padStart(
                2,
                "0"
            );


    const day =
        String(
            fecha.getDate()
        )
            .padStart(
                2,
                "0"
            );


    return (
        `${year}-${month}-${day}`
    );

}


function prepararRango({
    desde,
    hasta
}) {

    const inicio =
        fechaLocal(desde);


    const fin =
        fechaLocal(hasta);


    if (
        inicio.getTime() >
        fin.getTime()
    ) {

        throw new Error(
            "La fecha desde no puede ser posterior a la fecha hasta."
        );

    }


    /*
     * Hasta exclusivo:
     * si el usuario selecciona 07/09,
     * incluimos todo el 07/09.
     */

    const finExclusivo =
        new Date(fin);

    const diasPeriodo =
        Math.round(
            (
                Date.UTC(
                    finExclusivo.getFullYear(),
                    finExclusivo.getMonth(),
                    finExclusivo.getDate()
                ) -
                Date.UTC(
                    inicio.getFullYear(),
                    inicio.getMonth(),
                    inicio.getDate()
                )
            ) /
            86400000
        );


    const anteriorHasta =
        new Date(inicio);


    const anteriorDesde =
        new Date(inicio);


    anteriorDesde.setDate(
        anteriorDesde.getDate() -
        diasPeriodo
    );

    finExclusivo.setDate(
        finExclusivo.getDate() +
        1
    );


    /*
     * Balance:
     * 12 meses terminando en
     * el mes seleccionado.
     */

    const inicioBalance =
        new Date(fin);


    inicioBalance.setDate(1);

    inicioBalance.setMonth(
        inicioBalance.getMonth() -
        11
    );


    return {

        desde:
            inicio.toISOString(),

        hasta:
            finExclusivo
                .toISOString(),

        anteriorDesde:
            anteriorDesde
                .toISOString(),

        anteriorHasta:
            anteriorHasta
                .toISOString(),

        balanceDesde:
            inicioBalance
                .toISOString(),

        mesInicial:
            fechaTextoLocal(
                inicioBalance
            )

    };

}


export function registerReportesHandlers() {

    ipcMain.handle(
        "reportes:dashboard",
        (
            _event,
            filtros = {}
        ) => {

            const rango =
                prepararRango({

                    desde:
                        filtros.desde,

                    hasta:
                        filtros.hasta

                });


            return obtenerDashboardReportes({

                ...rango,

                limiteProductos:
                    10

            });

        }
    );

}