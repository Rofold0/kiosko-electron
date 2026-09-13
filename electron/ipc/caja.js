import {
    handleProtegido
} from "../security/ipcPermissions.js";
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

import {
    auditar
} from "../security/audit.js";


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

    handleProtegido(
        "caja:actual",
        () =>
            obtenerCajaActual()
    );


    handleProtegido(
        "caja:abrir",

        (
            event,
            datos
        ) => {

            const saldoInicial =
                validarDinero(
                    datos?.saldo_inicial,
                    "Saldo inicial"
                );


            const caja =
                abrirCaja({

                    saldoInicial,

                    notas:
                        texto(
                            datos?.notas
                        )

                });


            auditar(
                event,
                {
                    modulo:
                        "CAJA",

                    accion:
                        "ABRIR",

                    entidad:
                        "caja",

                    entidadId:
                        caja.id,

                    descripcion:
                        `Caja #${caja.id} abierta.`,

                    detalles: {

                        saldo_inicial:
                            caja.saldo_inicial

                    }
                }
            );


            return caja;

        }
    );


    handleProtegido(
    "caja:movimiento-manual",

    (
        event,
        datos
    ) => {

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


        const concepto =
            texto(
                datos?.concepto,
                true
            );


        const metodoPago =
            validarMetodo(
                datos?.metodo_pago
            );


        const movimiento =
            registrarMovimientoManual({

                tipo,
                concepto,
                monto,
                metodoPago,

                notas:
                    texto(
                        datos?.notas
                    )

            });


        auditar(
            event,
            {
                modulo:
                    "CAJA",

                accion:
                    tipo ===
                        "INGRESO_MANUAL"
                        ? "INGRESO_MANUAL"
                        : "EGRESO_MANUAL",

                entidad:
                    "movimiento_caja",

                entidadId:
                    movimiento.id,

                descripcion:
                    `${concepto} · ${movimiento.monto}`,

                detalles: {

                    caja_id:
                        movimiento.caja_id,

                    tipo:
                        movimiento.tipo,

                    monto:
                        movimiento.monto,

                    metodo_pago:
                        movimiento.metodo_pago

                }
            }
        );


        return movimiento;

    }
);


    handleProtegido(
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


    handleProtegido(
    "caja:cerrar",

    (
        event,
        datos
    ) => {

        const efectivoReal =
            validarDinero(
                datos?.efectivo_real,
                "Efectivo contado"
            );


        const caja =
            cerrarCaja({

                efectivoReal,

                notas:
                    texto(
                        datos?.notas
                    )

            });


        auditar(
            event,
            {
                modulo:
                    "CAJA",

                accion:
                    "CERRAR",

                entidad:
                    "caja",

                entidadId:
                    caja.id,

                descripcion:
                    `Caja #${caja.id} cerrada.`,

                detalles: {

                    efectivo_esperado:
                        caja.efectivo_esperado,

                    efectivo_real:
                        caja.efectivo_real,

                    diferencia:
                        caja.diferencia

                }
            }
        );


        return caja;

    }
);


    handleProtegido(
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


    handleProtegido(
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


    handleProtegido(
        "caja:obtener",
        (_event, id) =>
            obtenerCaja(
                validarId(id)
            )
    );

}