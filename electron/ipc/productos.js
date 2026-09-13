import {
    handleProtegido
} from "../security/ipcPermissions.js";

import {
    listarProductos,
    crearProducto,
    actualizarProducto,
    eliminarProducto
} from "../database/repositories/productosRepository.js";

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


function validarNombre(valor) {

    const nombre =
        valor?.trim();


    if (!nombre) {

        throw new Error(
            "El nombre del producto es obligatorio."
        );

    }


    return nombre;
}


function textoOpcional(valor) {

    const texto =
        valor?.trim();


    return texto || null;

}


function enteroNoNegativo(
    valor,
    mensaje
) {

    const numero =
        Number(valor);


    if (
        !Number.isInteger(numero) ||
        numero < 0
    ) {

        throw new Error(
            mensaje
        );

    }


    return numero;
}


export function registerProductosHandlers() {

    handleProtegido(
        "productos:listar",
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


            const categoriaId =
                validarIdOpcional(
                    filtros.categoria_id
                );


            const subcategoriaId =
                validarIdOpcional(
                    filtros.subcategoria_id
                );


            const resultado =
                listarProductos({

                    busqueda:
                        filtros.busqueda
                            ?.trim() || "",

                    categoriaId,

                    subcategoriaId,

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
        "productos:crear",
        (event, producto) => {

            const resultado =
                crearProducto({

                    nombre:
                        validarNombre(
                            producto?.nombre
                        ),

                    descripcion:
                        textoOpcional(
                            producto?.descripcion
                        ),

                    codigo:
                        textoOpcional(
                            producto?.codigo
                        ),

                    categoriaId:
                        validarId(
                            producto?.categoria_id,
                            "Debe seleccionar una categoría."
                        ),

                    subcategoriaId:
                        validarIdOpcional(
                            producto?.subcategoria_id
                        ),

                    stockInicial:
                        enteroNoNegativo(
                            producto?.stock_inicial,
                            "El stock inicial es inválido."
                        ),

                    stockMinimo:
                        enteroNoNegativo(
                            producto?.stock_minimo,
                            "El stock mínimo es inválido."
                        ),

                    unidad:
                        producto?.unidad
                            ?.trim() ||
                        "unidad"

                });


            auditar(
                event,
                {
                    modulo:
                        "PRODUCTOS",

                    accion:
                        "CREAR",

                    entidad:
                        "producto",

                    entidadId:
                        resultado.id,

                    descripcion:
                        `Producto "${resultado.nombre}" creado.`,

                    detalles: {
                        codigo:
                            resultado.codigo,

                        stock_inicial:
                            resultado.stock_actual,

                        stock_minimo:
                            resultado.stock_minimo
                    }
                }
            );


            return resultado;

        }
    );


    handleProtegido(
        "productos:actualizar",
        (event, producto) => {

            const resultado =
                actualizarProducto({

                    id:
                        validarId(
                            producto?.id,
                            "ID de producto inválido."
                        ),

                    nombre:
                        validarNombre(
                            producto?.nombre
                        ),

                    descripcion:
                        textoOpcional(
                            producto?.descripcion
                        ),

                    codigo:
                        textoOpcional(
                            producto?.codigo
                        ),

                    categoriaId:
                        validarId(
                            producto?.categoria_id,
                            "Debe seleccionar una categoría."
                        ),

                    subcategoriaId:
                        validarIdOpcional(
                            producto?.subcategoria_id
                        ),

                    stockMinimo:
                        enteroNoNegativo(
                            producto?.stock_minimo,
                            "El stock mínimo es inválido."
                        ),

                    unidad:
                        producto?.unidad
                            ?.trim() ||
                        "unidad"

                });
            auditar(
                event,
                {
                    modulo:
                        "PRODUCTOS",

                    accion:
                        "ACTUALIZAR",

                    entidad:
                        "producto",

                    entidadId:
                        resultado.id,

                    descripcion:
                        `Producto "${resultado.nombre}" actualizado.`,

                    detalles: {
                        codigo:
                            resultado.codigo,

                        categoria_id:
                            resultado.categoria_id,

                        subcategoria_id:
                            resultado.subcategoria_id,

                        stock_minimo:
                            resultado.stock_minimo,

                        unidad:
                            resultado.unidad
                    }
                }
            );
            return resultado;

        }
    );


    handleProtegido(
        "productos:eliminar",
        (event, id) => {

            const productoId =
                validarId(
                    id,
                    "ID de producto inválido."
                );


            const resultado =
                eliminarProducto(
                    productoId
                );


            auditar(
                event,
                {
                    modulo:
                        "PRODUCTOS",

                    accion:
                        "DESACTIVAR",

                    entidad:
                        "producto",

                    entidadId:
                        productoId,

                    descripcion:
                        `Producto #${productoId} desactivado.`
                }
            );


            return resultado;

        }
    );

}