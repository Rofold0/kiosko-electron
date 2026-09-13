import {
    handleProtegido
} from "../security/ipcPermissions.js";

import {
    listarSubcategorias,
    crearSubcategoria,
    actualizarSubcategoria,
    eliminarSubcategoria
} from "../database/repositories/subcategoriasRepository.js";

import {
    auditar
} from "../security/audit.js";


function validarId(
    valor,
    mensaje
) {

    const id = Number(valor);

    if (
        !Number.isInteger(id) ||
        id <= 0
    ) {

        throw new Error(mensaje);

    }

    return id;
}


function validarNombre(valor) {

    const nombre =
        valor?.trim();


    if (!nombre) {

        throw new Error(
            "El nombre de la subcategoría es obligatorio."
        );

    }


    return nombre;
}


export function registerSubcategoriasHandlers() {

    handleProtegido(
        "subcategorias:listar",
        () => {

            return listarSubcategorias();

        }
    );


    handleProtegido(
        "subcategorias:crear",

        (
            event,
            subcategoria
        ) => {

            const categoriaId =
                validarId(
                    subcategoria?.categoria_id,
                    "Debe seleccionar una categoría."
                );


            const nombre =
                validarNombre(
                    subcategoria?.nombre
                );


            const resultado =
                crearSubcategoria(
                    categoriaId,
                    nombre
                );


            auditar(
                event,
                {
                    modulo:
                        "SUBCATEGORIAS",

                    accion:
                        "CREAR",

                    entidad:
                        "subcategoria",

                    entidadId:
                        resultado.id,

                    descripcion:
                        `Subcategoría "${resultado.nombre}" creada.`,

                    detalles: {
                        categoria_id:
                            categoriaId,

                        nombre
                    }
                }
            );


            return resultado;

        }
    );


    handleProtegido(
        "subcategorias:actualizar",

        (
            event,
            subcategoria
        ) => {

            const id =
                validarId(
                    subcategoria?.id,
                    "ID de subcategoría inválido."
                );


            const categoriaId =
                validarId(
                    subcategoria?.categoria_id,
                    "Debe seleccionar una categoría."
                );


            const nombre =
                validarNombre(
                    subcategoria?.nombre
                );


            const resultado =
                actualizarSubcategoria(
                    id,
                    categoriaId,
                    nombre
                );


            auditar(
                event,
                {
                    modulo:
                        "SUBCATEGORIAS",

                    accion:
                        "ACTUALIZAR",

                    entidad:
                        "subcategoria",

                    entidadId:
                        id,

                    descripcion:
                        `Subcategoría #${id} actualizada.`,

                    detalles: {
                        categoria_id:
                            categoriaId,

                        nombre
                    }
                }
            );


            return resultado;

        }
    );


    handleProtegido(
        "subcategorias:eliminar",

        (
            event,
            valor
        ) => {

            const subcategoriaId =
                validarId(
                    valor,
                    "ID de subcategoría inválido."
                );


            const resultado =
                eliminarSubcategoria(
                    subcategoriaId
                );


            auditar(
                event,
                {
                    modulo:
                        "SUBCATEGORIAS",

                    accion:
                        "DESACTIVAR",

                    entidad:
                        "subcategoria",

                    entidadId:
                        subcategoriaId,

                    descripcion:
                        `Subcategoría #${subcategoriaId} desactivada.`
                }
            );


            return resultado;

        }
    );

} 