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

            return agregarProducto({

                productoId:
                    validarId(
                        datos?.producto_id,
                        "ID de producto inválido."
                    ),

                cantidad:
                    validarCantidad(
                        datos?.cantidad
                    )

            });

        }
    );


    handleProtegido(
        "lista-compras:agregar-libre",
        (_event, datos) => {

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

            return eliminarItem(
                validarId(id)
            );

        }
    );


    handleProtegido(
        "lista-compras:notas",
        (_event, notas) => {

            return actualizarNotas(
                notas?.trim() ||
                null
            );

        }
    );


    handleProtegido(
        "lista-compras:agregar-stock-bajo",
        () => {

            return agregarProductosStockBajo();

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

            return completarLista();

        }
    );

}