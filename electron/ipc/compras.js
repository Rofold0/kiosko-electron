import {
    ipcMain
} from "electron";

import {
    registrarCompra,
    listarPendientesProveedor,
    listarCompras,
    obtenerCompra
} from "../database/repositories/comprasRepository.js";


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


function validarIdOpcional(valor) {

    if (
        valor === null ||
        valor === undefined ||
        valor === ""
    ) {

        return null;

    }


    return validarId(valor);

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


function validarCosto(valor) {

    const costo =
        Number(valor);


    if (
        !Number.isFinite(costo) ||
        costo < 0
    ) {

        throw new Error(
            "El costo unitario es inválido."
        );

    }


    return costo;

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
            "La fecha de compra es inválida."
        );

    }


    return fecha.toISOString();

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

            listaItemId:
                validarIdOpcional(
                    item?.lista_item_id
                ),

            cantidad:
                validarCantidad(
                    item?.cantidad
                ),

            costoUnitario:
                validarCosto(
                    item?.costo_unitario
                )

        })
    );

}


export function registerComprasHandlers() {

    ipcMain.handle(
        "compras:crear",
        (_event, datos) => {

            return registrarCompra({

                proveedorId:
                    validarId(
                        datos?.proveedor_id,
                        "Debe seleccionar un proveedor."
                    ),

                fecha:
                    validarFecha(
                        datos?.fecha
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
        "compras:pendientes-proveedor",
        (_event, proveedorId) => {

            return listarPendientesProveedor(
                validarId(
                    proveedorId,
                    "Proveedor inválido."
                )
            );

        }
    );


    ipcMain.handle(
        "compras:listar",
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
                        ) || 25
                    )
                );


            const proveedorId =
                validarIdOpcional(
                    filtros.proveedor_id
                );


            const resultado =
                listarCompras({

                    proveedorId,

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
        "compras:obtener",
        (_event, id) => {

            return obtenerCompra(
                validarId(
                    id,
                    "ID de compra inválido."
                )
            );

        }
    );

}