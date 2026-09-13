import {
    handleProtegido
} from "../security/ipcPermissions.js";
import {
    registrarEntrada,
    registrarSalida,
    ajustarStock,
    listarMovimientos,
    listarStockBajo
} from "../database/repositories/stockRepository.js";


function validarId(valor) {

    const id =
        Number(valor);


    if (
        !Number.isInteger(id) ||
        id <= 0
    ) {

        throw new Error(
            "ID de producto inválido."
        );

    }


    return id;
}


function validarCantidad(valor) {

    const cantidad =
        Number(valor);


    if (
        !Number.isInteger(cantidad) ||
        cantidad <= 0
    ) {

        throw new Error(
            "La cantidad debe ser mayor que cero."
        );

    }


    return cantidad;
}


function validarStock(valor) {

    const stock =
        Number(valor);


    if (
        !Number.isInteger(stock) ||
        stock < 0
    ) {

        throw new Error(
            "El stock debe ser cero o mayor."
        );

    }


    return stock;
}


function motivoOpcional(valor) {

    return (
        valor?.trim() ||
        null
    );

}


export function registerStockHandlers() {

    handleProtegido(
        "stock:entrada",

        (
            event,
            datos
        ) => {

            const resultado =
                registrarEntrada({

                    productoId:
                        validarId(
                            datos?.producto_id
                        ),

                    cantidad:
                        validarCantidad(
                            datos?.cantidad
                        ),

                    motivo:
                        motivoOpcional(
                            datos?.motivo
                        )

                });


            auditar(
                event,
                {
                    modulo:
                        "STOCK",

                    accion:
                        "ENTRADA",

                    entidad:
                        "movimiento_stock",

                    entidadId:
                        resultado.movimiento.id,

                    descripcion:
                        `Entrada de stock para ${resultado.producto.nombre}.`,

                    detalles: {

                        producto_id:
                            resultado.producto.id,

                        cantidad:
                            resultado.movimiento.cantidad,

                        stock_anterior:
                            resultado
                                .movimiento
                                .stock_anterior,

                        stock_nuevo:
                            resultado
                                .movimiento
                                .stock_nuevo,

                        motivo:
                            resultado.movimiento.motivo

                    }
                }
            );


            return resultado;

        }
    );

    handleProtegido(
    "stock:salida",

    (
        event,
        datos
    ) => {

        const resultado =
            registrarSalida({

                productoId:
                    validarId(
                        datos?.producto_id
                    ),

                cantidad:
                    validarCantidad(
                        datos?.cantidad
                    ),

                motivo:
                    motivoOpcional(
                        datos?.motivo
                    )

            });


        auditar(
            event,
            {
                modulo:
                    "STOCK",

                accion:
                    "SALIDA",

                entidad:
                    "movimiento_stock",

                entidadId:
                    resultado.movimiento.id,

                descripcion:
                    `Salida de stock para ${resultado.producto.nombre}.`,

                detalles: {

                    producto_id:
                        resultado.producto.id,

                    cantidad:
                        resultado.movimiento.cantidad,

                    stock_anterior:
                        resultado
                            .movimiento
                            .stock_anterior,

                    stock_nuevo:
                        resultado
                            .movimiento
                            .stock_nuevo,

                    motivo:
                        resultado.movimiento.motivo

                }
            }
        );


        return resultado;

    }
);


    handleProtegido(
    "stock:ajustar",

    (
        event,
        datos
    ) => {

        const resultado =
            ajustarStock({

                productoId:
                    validarId(
                        datos?.producto_id
                    ),

                nuevoStock:
                    validarStock(
                        datos?.nuevo_stock
                    ),

                motivo:
                    motivoOpcional(
                        datos?.motivo
                    )

            });


        auditar(
            event,
            {
                modulo:
                    "STOCK",

                accion:
                    "AJUSTAR",

                entidad:
                    "movimiento_stock",

                entidadId:
                    resultado.movimiento.id,

                descripcion:
                    `Stock de ${resultado.producto.nombre} ajustado.`,

                detalles: {

                    producto_id:
                        resultado.producto.id,

                    stock_anterior:
                        resultado
                            .movimiento
                            .stock_anterior,

                    stock_nuevo:
                        resultado
                            .movimiento
                            .stock_nuevo,

                    diferencia:
                        resultado
                            .movimiento
                            .cantidad,

                    motivo:
                        resultado.movimiento.motivo

                }
            }
        );


        return resultado;

    }
);


    handleProtegido(
        "stock:movimientos",
        (_event, filtros) => {

            const productoId =
                validarId(
                    filtros?.producto_id
                );


            const pagina =
                Math.max(
                    1,
                    Number(
                        filtros?.pagina
                    ) || 1
                );


            const limite =
                Math.min(
                    100,
                    Math.max(
                        1,
                        Number(
                            filtros?.limite
                        ) || 50
                    )
                );


            const resultado =
                listarMovimientos({

                    productoId,

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
        "stock:bajo-minimo",
        () => {

            return listarStockBajo();

        }
    );

}