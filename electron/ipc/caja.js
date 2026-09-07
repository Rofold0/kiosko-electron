import {
    ipcMain
} from "electron";

import {
    abrirCaja,
    cerrarCaja,
    obtenerCajaActual,
    registrarMovimientoManual,
    revertirMovimientoManual,
    listarMovimientosCaja,
    listarCajas,
    obtenerCaja
} from "../database/repositories/cajaRepository.js";


const METODOS =
    new Set([
        "EFECTIVO",
        "TRANSFERENCIA",
        "DEBITO",
        "CREDITO",
        "QR",
        "OTRO"
    ]);


function validarId(valor) {

    const id =
        Number(valor);


    if (
        !Number.isInteger(id) ||
        id <= 0
    ) {

        throw new Error(
            "ID inválido."
        );

    }


    return id;

}


function validarDinero(
    valor,
    nombre
) {

    const numero =
        Number(valor);


    if (
        !Number.isFinite(numero) ||
        numero < 0
    ) {

        throw new Error(
            `${nombre} inválido.`
        );

    }


    return numero;

}


function validarMetodo(valor) {

    const metodo =
        String(
            valor || ""
        )
            .trim()
            .toUpperCase();


    if (
        !METODOS.has(
            metodo
        )
    ) {

        throw new Error(
            "Método de pago inválido."
        );

    }


    return metodo;

}


function texto(
    valor,
    obligatorio = false
) {

    const resultado =
        valor?.trim() || "";


    if (
        obligatorio &&
        resultado.length < 3
    ) {

        throw new Error(
            "Debe indicar un concepto."
        );

    }


    return resultado || null;

}


export function registerCajaHandlers() {

    ipcMain.handle(
        "caja:actual",
        () =>
            obtenerCajaActual()
    );


    ipcMain.handle(
        "caja:abrir",
        (_event, datos) =>

            abrirCaja({

                saldoInicial:
                    validarDinero(
                        datos?.saldo_inicial,
                        "Saldo inicial"
                    ),

                notas:
                    texto(
                        datos?.notas
                    )

            })
    );


    ipcMain.handle(
        "caja:movimiento-manual",
        (_event, datos) => {

            const tipo =
                datos?.tipo === "INGRESO"
                    ? "INGRESO_MANUAL"
                    : datos?.tipo === "EGRESO"
                        ? "EGRESO_MANUAL"
                        : null;


            if (!tipo) {

                throw new Error(
                    "Tipo de movimiento inválido."
                );

            }


            const monto =
                validarDinero(
                    datos?.monto,
                    "Monto"
                );


            if (monto <= 0) {

                throw new Error(
                    "El monto debe ser mayor que cero."
                );

            }


            return registrarMovimientoManual({

                tipo,

                concepto:
                    texto(
                        datos?.concepto,
                        true
                    ),

                monto,

                metodoPago:
                    validarMetodo(
                        datos?.metodo_pago
                    ),

                notas:
                    texto(
                        datos?.notas
                    )

            });

        }
    );


    ipcMain.handle(
    "caja:revertir-manual",
    (_event, datos) => {

        const motivo =
            datos
                ?.motivo
                ?.trim();


        if (
            !motivo ||
            motivo.length < 3
        ) {

            throw new Error(
                "Debe indicar el motivo de la reversión."
            );

        }


        return revertirMovimientoManual({

            movimientoId:
                validarId(
                    datos?.id
                ),

            motivo

        });

    }
);


    ipcMain.handle(
        "caja:cerrar",
        (_event, datos) =>

            cerrarCaja({

                efectivoReal:
                    validarDinero(
                        datos?.efectivo_real,
                        "Efectivo contado"
                    ),

                notas:
                    texto(
                        datos?.notas
                    )

            })
    );


    ipcMain.handle(
        "caja:movimientos",
        (_event, filtros = {}) => {

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


            const resultado =
                listarMovimientosCaja({

                    cajaId:
                        validarId(
                            filtros.caja_id
                        ),

                    metodoPago:
                        filtros.metodo_pago
                            ? validarMetodo(
                                filtros.metodo_pago
                            )
                            : null,

                    limite,

                    offset:
                        (
                            pagina - 1
                        ) * limite

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


    ipcMain.handle(
        "caja:historial",
        (_event, filtros = {}) => {

            const pagina =
                Math.max(
                    1,
                    Number(
                        filtros.pagina
                    ) || 1
                );


            const limite = 25;


            const resultado =
                listarCajas({

                    limite,

                    offset:
                        (
                            pagina - 1
                        ) * limite

                });


            return {

                ...resultado,

                pagina,

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


    ipcMain.handle(
        "caja:obtener",
        (_event, id) =>
            obtenerCaja(
                validarId(id)
            )
    );

}