import {
    handleProtegido
} from "../security/ipcPermissions.js";

import {
    listarSubcategorias,
    crearSubcategoria,
    actualizarSubcategoria,
    eliminarSubcategoria
} from "../database/repositories/subcategoriasRepository.js";


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
        (_event, subcategoria) => {

            const categoriaId =
                validarId(
                    subcategoria?.categoria_id,
                    "Debe seleccionar una categoría."
                );

            const nombre =
                validarNombre(
                    subcategoria?.nombre
                );


            return crearSubcategoria(
                categoriaId,
                nombre
            );

        }
    );


    handleProtegido(
        "subcategorias:actualizar",
        (_event, subcategoria) => {

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


            return actualizarSubcategoria(
                id,
                categoriaId,
                nombre
            );

        }
    );


    handleProtegido(
        "subcategorias:eliminar",
        (_event, id) => {

            return eliminarSubcategoria(
                validarId(
                    id,
                    "ID de subcategoría inválido."
                )
            );

        }
    );

} 