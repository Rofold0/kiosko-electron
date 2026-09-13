import {
    handleProtegido
} from "../security/ipcPermissions.js";
import {
    listarProveedores,
    crearProveedor,
    actualizarProveedor,
    eliminarProveedor,
    listarProductosProveedor,
    listarProveedoresProducto,
    vincularProducto,
    actualizarVinculo,
    desvincularProducto
} from "../database/repositories/proveedoresRepository.js";

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


function validarNombre(valor) {

    const nombre =
        valor?.trim();


    if (!nombre) {

        throw new Error(
            "El nombre del proveedor es obligatorio."
        );

    }


    return nombre;

}


function textoOpcional(valor) {

    const texto =
        valor?.trim();


    return texto || null;

}


function costoOpcional(valor) {

    if (
        valor === null ||
        valor === undefined ||
        valor === ""
    ) {

        return null;

    }


    const costo =
        Number(valor);


    if (
        !Number.isFinite(costo) ||
        costo < 0
    ) {

        throw new Error(
            "El costo es inválido."
        );

    }


    return costo;

}


export function registerProveedoresHandlers() {

    handleProtegido(
        "proveedores:listar",
        () => {

            return listarProveedores();

        }
    );


    handleProtegido(
        "proveedores:crear",
        (_event, proveedor) => {

            const resultado =
                actualizarProveedor({
                    // datos actuales
                });


            auditar(
                event,
                {
                    modulo:
                        "PROVEEDORES",

                    accion:
                        "ACTUALIZAR",

                    entidad:
                        "proveedor",

                    entidadId:
                        resultado.id,

                    descripcion:
                        `Proveedor "${resultado.nombre}" actualizado.`
                }
            );


            return resultado;

        }
    );


    handleProtegido(
        "proveedores:actualizar",
        (_event, proveedor) => {

            return actualizarProveedor({

                id:
                    validarId(
                        proveedor?.id,
                        "ID de proveedor inválido."
                    ),

                nombre:
                    validarNombre(
                        proveedor?.nombre
                    ),

                telefono:
                    textoOpcional(
                        proveedor?.telefono
                    ),

                direccion:
                    textoOpcional(
                        proveedor?.direccion
                    ),

                notas:
                    textoOpcional(
                        proveedor?.notas
                    )

            });

        }
    );


    handleProtegido(
        "proveedores:eliminar",
        (_event, id) => {

            const proveedorId =
                validarId(
                    id,
                    "ID de proveedor inválido."
                );


            const resultado =
                eliminarProveedor(
                    proveedorId
                );


            auditar(
                event,
                {
                    modulo:
                        "PROVEEDORES",

                    accion:
                        "DESACTIVAR",

                    entidad:
                        "proveedor",

                    entidadId:
                        proveedorId,

                    descripcion:
                        `Proveedor #${proveedorId} desactivado.`
                }
            );


            return resultado;

        }
    );


    handleProtegido(
        "proveedores:productos",
        (_event, proveedorId) => {

            return listarProductosProveedor(
                validarId(
                    proveedorId,
                    "ID de proveedor inválido."
                )
            );

        }
    );


    handleProtegido(
        "proveedores:por-producto",
        (_event, productoId) => {

            return listarProveedoresProducto(
                validarId(
                    productoId,
                    "ID de producto inválido."
                )
            );

        }
    );


    handleProtegido(
        "proveedores:vincular-producto",
        (_event, datos) => {

            const proveedorId =
                validarId(
                    datos?.proveedor_id,
                    "ID de proveedor inválido."
                );


            const productoId =
                validarId(
                    datos?.producto_id,
                    "ID de producto inválido."
                );


            const resultado =
                vincularProducto({

                    proveedorId,
                    productoId,

                    codigoProveedor:
                        textoOpcional(
                            datos?.codigo_proveedor
                        ),

                    ultimoCosto:
                        costoOpcional(
                            datos?.ultimo_costo
                        ),

                    notas:
                        textoOpcional(
                            datos?.notas
                        )

                });


            auditar(
                event,
                {
                    modulo:
                        "PROVEEDORES",

                    accion:
                        "VINCULAR_PRODUCTO",

                    entidad:
                        "producto_proveedor",

                    entidadId:
                        resultado.id,

                    descripcion:
                        `Producto #${productoId} vinculado al proveedor #${proveedorId}.`,

                    detalles: {
                        producto_id:
                            productoId,

                        proveedor_id:
                            proveedorId
                    }
                }
            );


            return resultado;

        }
    );


    handleProtegido(
        "proveedores:actualizar-vinculo",
        (_event, datos) => {

            auditar(
                event,
                {
                    modulo:
                        "PROVEEDORES",

                    accion:
                        "ACTUALIZAR_VINCULO",

                    entidad:
                        "producto_proveedor",

                    entidadId:
                        vinculoId,

                    descripcion:
                        `Vínculo producto-proveedor #${vinculoId} actualizado.`,

                    detalles: {
                        ultimo_costo:
                            ultimoCosto
                    }
                }
            );
            return actualizarVinculo({

                id:
                    validarId(
                        datos?.id
                    ),

                codigoProveedor:
                    textoOpcional(
                        datos?.codigo_proveedor
                    ),

                ultimoCosto:
                    costoOpcional(
                        datos?.ultimo_costo
                    ),

                notas:
                    textoOpcional(
                        datos?.notas
                    )

            });

        }
    );


    handleProtegido(
        "proveedores:desvincular-producto",
        (_event, id) => {

            auditar(
                event,
                {
                    modulo:
                        "PROVEEDORES",

                    accion:
                        "DESVINCULAR_PRODUCTO",

                    entidad:
                        "producto_proveedor",

                    entidadId:
                        vinculoId,

                    descripcion:
                        `Vínculo producto-proveedor #${vinculoId} eliminado.`
                }
            );

            return desvincularProducto(
                validarId(id)
            );

        }
    );

}