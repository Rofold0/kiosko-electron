import {
    ipcMain
} from "electron";

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

    ipcMain.handle(
        "stock:entrada",
        (_event, datos) => {

            return registrarEntrada({

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

        }
    );


    ipcMain.handle(
        "stock:salida",
        (_event, datos) => {

            return registrarSalida({

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

        }
    );


    ipcMain.handle(
        "stock:ajustar",
        (_event, datos) => {

            return ajustarStock({

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

        }
    );


    ipcMain.handle(
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


    ipcMain.handle(
        "stock:bajo-minimo",
        () => {

            return listarStockBajo();

        }
    );

}