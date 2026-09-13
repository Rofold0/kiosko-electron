import {
    handleProtegido
} from "../security/ipcPermissions.js";
import {
    listarResumenPrecios,
    obtenerDetallePrecio,
    obtenerPrecioVigente,
    guardarPrecio
} from "../database/repositories/preciosRepository.js";

import {
    auditar
} from "../security/audit.js";

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

function validarIdOpcional(
    valor
) {

    if (
        valor === null ||
        valor === undefined ||
        valor === ""
    ) {

        return null;

    }


    return validarId(
        valor
    );

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


export function registerPreciosHandlers() {

    handleProtegido(
        "precios:listar",
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
                listarResumenPrecios({

                    busqueda:
                        filtros.busqueda ||
                        "",

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
        "precios:detalle",
        (_event, productoId) => {

            return obtenerDetallePrecio(
                validarId(
                    productoId
                )
            );

        }
    );


    handleProtegido(
        "precios:vigente",
        (_event, productoId) => {

            return obtenerPrecioVigente(
                validarId(
                    productoId
                )
            );

        }
    );


    handleProtegido(
    "precios:guardar",

    (
        event,
        datos
    ) => {

        const productoId =
            validarId(
                datos?.producto_id
            );


        const proveedorId =
            validarIdOpcional(
                datos?.proveedor_id
            );


        const costo =
            validarDinero(
                datos?.costo,
                "Costo"
            );


        const precioVenta =
            validarDinero(
                datos?.precio_venta,
                "Precio de venta"
            );


        const anterior =
            obtenerPrecioVigente(
                productoId
            );


        const resultado =
            guardarPrecio({

                productoId,
                proveedorId,
                costo,
                precioVenta

            });


        auditar(
            event,
            {
                modulo:
                    "PRECIOS",

                accion:
                    "GUARDAR",

                entidad:
                    "producto",

                entidadId:
                    productoId,

                descripcion:
                    `Precio del producto #${productoId} actualizado.`,

                detalles: {

                    proveedor_id:
                        proveedorId,

                    anterior:
                        anterior
                            ? {
                                costo:
                                    anterior.costo,

                                precio_venta:
                                    anterior.precio_venta
                            }
                            : null,

                    nuevo: {
                        costo:
                            resultado.costo,

                        precio_venta:
                            resultado.precio_venta
                    },

                    sin_cambios:
                        Boolean(
                            resultado.sin_cambios
                        )

                }
            }
        );


        return resultado;

    }
);
}