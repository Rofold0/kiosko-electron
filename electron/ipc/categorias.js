import {
    handleProtegido
} from "../security/ipcPermissions.js";
import {
    listarCategorias,
    crearCategoria,
    actualizarCategoria,
    eliminarCategoria
} from "../database/repositories/categoriasRepository.js";

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
        (_event, categoria) => {

            const nombre =
                validarNombre(
                    categoria?.nombre
                );

            return crearCategoria(nombre);

        }
    );


    handleProtegido(
        "categorias:actualizar",
        (_event, categoria) => {

            const id =
                validarId(
                    categoria?.id
                );

            const nombre =
                validarNombre(
                    categoria?.nombre
                );

            return actualizarCategoria(
                id,
                nombre
            );

        }
    );


    handleProtegido(
        "categorias:eliminar",
        (_event, id) => {

            return eliminarCategoria(
                validarId(id)
            );

        }
    );

}