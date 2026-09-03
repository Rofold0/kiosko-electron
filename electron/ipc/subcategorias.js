import { ipcMain } from "electron";

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

    ipcMain.handle(
        "subcategorias:listar",
        () => {

            return listarSubcategorias();

        }
    );


    ipcMain.handle(
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


    ipcMain.handle(
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


    ipcMain.handle(
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