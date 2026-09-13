import {
    handleProtegido
} from "../security/ipcPermissions.js";
import {
    obtenerListaActual,
    agregarProducto,
    agregarItemLibre,
    actualizarCantidad,
    marcarComprado,
    eliminarItem,
    actualizarNotas,
    agregarProductosStockBajo,
    listarHistorial,
    obtenerLista,
    completarLista
} from "../database/repositories/listaComprasRepository.js";

import {
    auditar
} from "../security/audit.js";


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
        !Number.isInteger(cantidad) ||
        cantidad <= 0
    ) {

        throw new Error(
            "La cantidad debe ser mayor que cero."
        );

    }


    return cantidad;
}


function validarNombre(valor) {

    const nombre =
        valor?.trim();


    if (!nombre) {

        throw new Error(
            "Debe ingresar un nombre."
        );

    }


    return nombre;
}


export function registerListaComprasHandlers() {

    handleProtegido(
        "lista-compras:actual",
        () =>
            obtenerListaActual()
    );


    handleProtegido(
        "lista-compras:agregar-producto",
        (_event, datos) => {

            const productoId =
                validarId(
                    datos?.producto_id,
                    "ID de producto inválido."
                );


            const cantidad =
                validarCantidad(
                    datos?.cantidad
                );


            const resultado =
                agregarProducto({
                    productoId,
                    cantidad
                });


            auditar(
                event,
                {
                    modulo:
                        "LISTA_COMPRAS",

                    accion:
                        "AGREGAR_PRODUCTO",

                    entidad:
                        "lista_compra",

                    entidadId:
                        resultado.id,

                    detalles: {
                        producto_id:
                            productoId,

                        cantidad
                    }
                }
            );


            return resultado;

        }
    );


    handleProtegido(
        "lista-compras:agregar-libre",
        (_event, datos) => {
            auditar(
                event,
                {
                    modulo:
                        "LISTA_COMPRAS",

                    accion:
                        "AGREGAR_LIBRE",

                    entidad:
                        "lista_compra",

                    entidadId:
                        resultado.id,

                    detalles: {
                        nombre,
                        cantidad
                    }
                }
            );
            return agregarItemLibre({

                nombre:
                    validarNombre(
                        datos?.nombre
                    ),

                cantidad:
                    validarCantidad(
                        datos?.cantidad
                    )

            });

        }
    );


    handleProtegido(
        "lista-compras:cantidad",
        (_event, datos) => {
            auditar(
                event,
                {
                    modulo:
                        "LISTA_COMPRAS",

                    accion:
                        "CAMBIAR_CANTIDAD",

                    entidad:
                        "item_lista_compras",

                    entidadId:
                        itemId,

                    detalles: {
                        cantidad
                    }
                }
            );
            return actualizarCantidad({

                itemId:
                    validarId(
                        datos?.item_id
                    ),

                cantidad:
                    validarCantidad(
                        datos?.cantidad
                    )

            });

        }
    );


    handleProtegido(
        "lista-compras:comprado",
        (_event, datos) => {
            auditar(
                event,
                {
                    modulo:
                        "LISTA_COMPRAS",

                    accion:
                        comprado
                            ? "MARCAR_COMPRADO"
                            : "MARCAR_PENDIENTE",

                    entidad:
                        "item_lista_compras",

                    entidadId:
                        itemId
                }
            );
            return marcarComprado({

                itemId:
                    validarId(
                        datos?.item_id
                    ),

                comprado:
                    Boolean(
                        datos?.comprado
                    )

            });

        }
    );


    handleProtegido(
        "lista-compras:eliminar-item",
        (_event, id) => {
            auditar(
                event,
                {
                    modulo:
                        "LISTA_COMPRAS",

                    accion:
                        "ELIMINAR_ITEM",

                    entidad:
                        "item_lista_compras",

                    entidadId:
                        itemId
                }
            );
            return eliminarItem(
                validarId(id)
            );

        }
    );


    handleProtegido(
        "lista-compras:notas",
        (_event, notas) => {
            auditar(
                event,
                {
                    modulo:
                        "LISTA_COMPRAS",

                    accion:
                        "ACTUALIZAR_NOTAS",

                    entidad:
                        "lista_compra",

                    entidadId:
                        resultado.id,

                    detalles: {
                        tiene_notas:
                            Boolean(
                                notasNormalizadas
                            )
                    }
                }
            );
            return actualizarNotas(
                notas?.trim() ||
                null
            );

        }
    );


    handleProtegido(
        "lista-compras:agregar-stock-bajo",
        () => {

            const resultado =
                agregarProductosStockBajo();


            auditar(
                event,
                {
                    modulo:
                        "LISTA_COMPRAS",

                    accion:
                        "AGREGAR_STOCK_BAJO",

                    entidad:
                        "lista_compra",

                    entidadId:
                        resultado.lista.id,

                    detalles: {
                        agregados:
                            resultado.agregados
                    }
                }
            );


            return resultado;

        }
    );


    handleProtegido(
        "lista-compras:historial",
        () => {

            return listarHistorial();

        }
    );


    handleProtegido(
        "lista-compras:obtener",
        (_event, id) => {

            return obtenerLista(
                validarId(id)
            );

        }
    );


    handleProtegido(
        "lista-compras:completar",
        () => {

            const resultado =
    completarLista();


auditar(
    event,
    {
        modulo:
            "LISTA_COMPRAS",

        accion:
            "COMPLETAR",

        entidad:
            "lista_compra",

        entidadId:
            resultado
                .lista_completada_id,

        detalles: {
            nueva_lista_id:
                resultado
                    .nueva_lista_id
        }
    }
);


return resultado;

        }
    );

}