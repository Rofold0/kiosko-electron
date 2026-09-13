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
        (_event, subcategoria) => {

            const resultado =
                crearSubcategoria(
                    nombre
                );


            auditar(
                event,
                {
                    modulo:
                        "SUBCATEGORIA   ",

                    accion:
                        "CREAR",

                    entidad:
                        "subcategoria",

                    entidadId:
                        resultado.id,

                    descripcion:
                        `Subategoría "${resultado.nombre}" creada.`
                }
            );


            return resultado;
        }
    );


    handleProtegido(
        "subcategorias:actualizar",
        (_event, subcategoria) => {

            const resultado =
                actualizarSubcategoria(
                    id,
                    nombre
                );


            auditar(
                event,
                {
                    modulo:
                        "SUBCATEGORIA",

                    accion:
                        "ACTUALIZAR",

                    entidad:
                        "subcategoria",

                    entidadId:
                        id,

                    descripcion:
                        `Subcategoría #${id} actualizada.`,

                    detalles: {
                        subcategoria_id: subcategoriaId,
                        nombre
                    }
                }
            );


            return resultado;

        }
    );


    handleProtegido(
        "subcategorias:eliminar",
        (_event, id) => {

            const subategoriaId =
                validarId(id);


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
                        categoriaId,

                    descripcion:
                        `Subcategoría #${subcategoriaId} desactivada.`
                }
            );


            return resultado;

        }
    );

} 