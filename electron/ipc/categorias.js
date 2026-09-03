import { ipcMain } from "electron";

import {
    listarCategorias,
    crearCategoria,
    actualizarCategoria,
    eliminarCategoria
} from "../database/repositories/categoriasRepository.js";
import CrudTable from "../components/crudTable.jsx";
import FormActions from "../components/formActions.jsx";

const columnasCategorias = [
    {
        key: "id",
        label: "ID"
    },
    {
        key: "nombre",
        label: "Nombre"
    }
];
const limpiarFormulario = () => {

    setNombre("");
    setEditandoId(null);

};

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

    ipcMain.handle(
        "categorias:listar",
        () => {
            return listarCategorias();
        }
    );


    ipcMain.handle(
        "categorias:crear",
        (_event, categoria) => {

            const nombre =
                validarNombre(
                    categoria?.nombre
                );

            return crearCategoria(nombre);

        }
    );


    ipcMain.handle(
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


    ipcMain.handle(
        "categorias:eliminar",
        (_event, id) => {

            return eliminarCategoria(
                validarId(id)
            );

        }
    );

}