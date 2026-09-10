import {
    handleProtegido
} from "../security/ipcPermissions.js";

import {
    registrarCompra,
    listarPendientesProveedor,
    listarCompras,
    obtenerCompra,
    revertirCompra
} from "../database/repositories/comprasRepository.js";

const METODOS_PAGO =
    new Set([
        "EFECTIVO",
        "TRANSFERENCIA",
        "DEBITO",
        "CREDITO",
        "QR",
        "OTRO"
    ]);

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

function validarMotivoReversion(
    valor
) {

    const motivo =
        valor?.trim();


    if (
        !motivo ||
        motivo.length < 3
    ) {

        throw new Error(
            "Debe indicar el motivo de la reversión."
        );

    }


    return motivo;

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

    handleProtegido(
        "compras:crear",
        (_event, datos) => {
            const registrarEnCaja =
                datos?.registrar_en_caja ===
                true;

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

                registrarEnCaja,

                metodoPago:
                    registrarEnCaja
                        ? validarMetodoPago(
                            datos?.metodo_pago
                        )
                        : null,

                items:
                    validarItems(
                        datos?.items
                    )

            });

        }
    );


    handleProtegido(
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


    handleProtegido(
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


    handleProtegido(
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

    handleProtegido(
        "compras:revertir",
        (_event, datos) => {

            return revertirCompra({

                compraId:
                    validarId(
                        datos?.id,
                        "ID de compra inválido."
                    ),

                motivo:
                    validarMotivoReversion(
                        datos?.motivo
                    )

            });

        }
    );

}