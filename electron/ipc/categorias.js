import {
    handleProtegido
} from "../security/ipcPermissions.js";
import {
    listarCategorias,
    crearCategoria,
    actualizarCategoria,
    eliminarCategoria
} from "../database/repositories/categoriasRepository.js";

import {
    auditar
} from "../security/audit.js";

function validarId(valor) {

    const id = Number(valor);

    if (
        !Number.isInteger(id) ||
        id <= 0
    ) {
        throw new Error(
            "ID de categoría inválido."
        );
    }

    return id;
}


function validarNombre(valor) {

    const nombre =
        valor?.trim();

    if (!nombre) {

        throw new Error(
            "El nombre de la categoría es obligatorio."
        );

    }

    return nombre;
}


export function registerCategoriasHandlers() {

    handleProtegido(
        "categorias:listar",
        () => {
            return listarCategorias();
        }
    );


    handleProtegido(
        "categorias:crear",

        (
            event,
            categoria
        ) => {

            const nombre =
                validarNombre(
                    categoria?.nombre
                );


            const resultado =
                crearCategoria(
                    nombre
                );


            auditar(
                event,
                {
                    modulo:
                        "CATEGORIAS",

                    accion:
                        "CREAR",

                    entidad:
                        "categoria",

                    entidadId:
                        resultado.id,

                    descripcion:
                        `Categoría "${resultado.nombre}" creada.`
                }
            );


            return resultado;

        }
    );


    handleProtegido(
        "categorias:actualizar",

        (
            event,
            categoria
        ) => {

            const id =
                validarId(
                    categoria?.id
                );


            const nombre =
                validarNombre(
                    categoria?.nombre
                );


            const resultado =
                actualizarCategoria(
                    id,
                    nombre
                );


            auditar(
                event,
                {
                    modulo:
                        "CATEGORIAS",

                    accion:
                        "ACTUALIZAR",

                    entidad:
                        "categoria",

                    entidadId:
                        id,

                    descripcion:
                        `Categoría #${id} actualizada.`,

                    detalles: {
                        nombre
                    }
                }
            );


            return resultado;

        }
    );


    handleProtegido(
        "categorias:eliminar",

        (
            event,
            valor
        ) => {

            const categoriaId =
                validarId(
                    valor
                );


            const resultado =
                eliminarCategoria(
                    categoriaId
                );


            auditar(
                event,
                {
                    modulo:
                        "CATEGORIAS",

                    accion:
                        "DESACTIVAR",

                    entidad:
                        "categoria",

                    entidadId:
                        categoriaId,

                    descripcion:
                        `Categoría #${categoriaId} desactivada.`
                }
            );


            return resultado;

        }
    );

}