import {
    ipcMain
} from "electron";

import {
    buscarProductosVenta,
    registrarVenta,
    listarVentas,
    obtenerVenta,
    revertirVenta
} from "../database/repositories/ventasRepository.js";


const METODOS_PAGO =
    new Set([
        "EFECTIVO",
        "TRANSFERENCIA",
        "DEBITO",
        "CREDITO",
        "QR",
        "OTRO"
    ]);


function validarId(
    valor,
    mensaje = "ID inválido."
) {

    const id =
        Number(valor);


    if (
        !Number.isInteger(id) ||
        id <= 0
    ) {

        throw new Error(
            mensaje
        );

    }


    return id;

}


function validarCantidad(valor) {

    const cantidad =
        Number(valor);


    if (
        !Number.isInteger(
            cantidad
        ) ||
        cantidad <= 0
    ) {

        throw new Error(
            "La cantidad es inválida."
        );

    }


    return cantidad;

}


function validarFecha(valor) {

    const fecha =
        valor
            ? new Date(valor)
            : new Date();


    if (
        Number.isNaN(
            fecha.getTime()
        )
    ) {

        throw new Error(
            "Fecha inválida."
        );

    }


    return fecha
        .toISOString();

}


function validarMetodoPago(
    valor
) {

    const metodo =
        String(
            valor || ""
        )
            .trim()
            .toUpperCase();


    if (
        !METODOS_PAGO.has(
            metodo
        )
    ) {

        throw new Error(
            "Método de pago inválido."
        );

    }


    return metodo;

}


function textoOpcional(valor) {

    return (
        valor?.trim() ||
        null
    );

}


function validarItems(items) {

    if (
        !Array.isArray(items) ||
        items.length === 0
    ) {

        throw new Error(
            "Debe agregar al menos un producto."
        );

    }


    return items.map(
        (item) => ({

            productoId:
                validarId(
                    item?.producto_id,
                    "Producto inválido."
                ),

            precioId:
                validarId(
                    item?.precio_id,
                    "Precio inválido."
                ),

            cantidad:
                validarCantidad(
                    item?.cantidad
                )

        })
    );

}


export function registerVentasHandlers() {

    ipcMain.handle(
        "ventas:productos",
        (
            _event,
            filtros = {}
        ) => {

            return buscarProductosVenta({

                busqueda:
                    filtros.busqueda ||
                    "",

                limite:
                    Math.min(
                        100,
                        Math.max(
                            1,
                            Number(
                                filtros.limite
                            ) || 30
                        )
                    )

            });

        }
    );


    ipcMain.handle(
        "ventas:crear",
        (
            _event,
            datos
        ) => {

            return registrarVenta({

                fecha:
                    validarFecha(
                        datos?.fecha
                    ),

                metodoPago:
                    validarMetodoPago(
                        datos
                            ?.metodo_pago
                    ),

                notas:
                    textoOpcional(
                        datos?.notas
                    ),

                items:
                    validarItems(
                        datos?.items
                    )

            });

        }
    );


    ipcMain.handle(
        "ventas:listar",
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
                        ) || 25
                    )
                );


            const metodoPago =
                filtros.metodo_pago
                    ? validarMetodoPago(
                        filtros.metodo_pago
                    )
                    : null;


            let estado =
                filtros.estado ||
                null;


            if (
                estado !== null &&
                ![
                    "ACTIVA",
                    "REVERTIDA"
                ].includes(
                    estado
                )
            ) {

                throw new Error(
                    "Estado inválido."
                );

            }


            const resultado =
                listarVentas({

                    metodoPago,
                    estado,
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
        "ventas:obtener",
        (
            _event,
            id
        ) => {

            return obtenerVenta(
                validarId(
                    id,
                    "ID de venta inválido."
                )
            );

        }
    );


    ipcMain.handle(
        "ventas:revertir",
        (
            _event,
            datos
        ) => {

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


            return revertirVenta({

                ventaId:
                    validarId(
                        datos?.id,
                        "ID de venta inválido."
                    ),

                motivo

            });

        }
    );

}