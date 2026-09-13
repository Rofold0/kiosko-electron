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

        (
            event,
            datos
        ) => {

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

        (
            event,
            datos
        ) => {

            const nombre =
                validarNombre(
                    datos?.nombre
                );


            const cantidad =
                validarCantidad(
                    datos?.cantidad
                );


            const resultado =
                agregarItemLibre({
                    nombre,
                    cantidad
                });


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


            return resultado;

        }
    );


    handleProtegido(
        "lista-compras:cantidad",

        (
            event,
            datos
        ) => {

            const itemId =
                validarId(
                    datos?.item_id
                );


            const cantidad =
                validarCantidad(
                    datos?.cantidad
                );


            const resultado =
                actualizarCantidad({
                    itemId,
                    cantidad
                });


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


            return resultado;

        }
    );


    handleProtegido(
        "lista-compras:comprado",

        (
            event,
            datos
        ) => {

            const itemId =
                validarId(
                    datos?.item_id
                );


            const comprado =
                Boolean(
                    datos?.comprado
                );


            const resultado =
                marcarComprado({
                    itemId,
                    comprado
                });


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


            return resultado;

        }
    );


    handleProtegido(
        "lista-compras:eliminar-item",

        (
            event,
            valor
        ) => {

            const itemId =
                validarId(
                    valor
                );


            const resultado =
                eliminarItem(
                    itemId
                );


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


            return resultado;

        }
    );


    handleProtegido(
        "lista-compras:notas",

        (
            event,
            notas
        ) => {

            const notasNormalizadas =
                notas?.trim() ||
                null;


            const resultado =
                actualizarNotas(
                    notasNormalizadas
                );


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


            return resultado;

        }
    );


    handleProtegido(
        "lista-compras:agregar-stock-bajo",

        (event) => {

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
        "lista-compras:completar",

        (event) => {

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





}