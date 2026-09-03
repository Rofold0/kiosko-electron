import db from "../database.js";


const listarStmt = db.prepare(`
    SELECT
        id,
        nombre

    FROM categorias

    WHERE activo = 1

    ORDER BY nombre COLLATE NOCASE ASC
`);


const crearStmt = db.prepare(`
    INSERT INTO categorias (
        nombre
    )
    VALUES (?)

    RETURNING
        id,
        nombre
`);


const actualizarStmt = db.prepare(`
    UPDATE categorias

    SET nombre = ?

    WHERE id = ?
      AND activo = 1

    RETURNING
        id,
        nombre
`);


const eliminarStmt = db.prepare(`
    UPDATE categorias

    SET activo = 0

    WHERE id = ?
      AND activo = 1

    RETURNING id
`);


const tieneSubcategoriasStmt = db.prepare(`
    SELECT 1

    FROM subcategorias

    WHERE categoria_id = ?
      AND activo = 1

    LIMIT 1
`);


function esErrorDuplicado(error) {

    return (
        error?.code ===
        "SQLITE_CONSTRAINT_UNIQUE"
    );

}


export function listarCategorias() {

    return listarStmt.all();

}


export function crearCategoria(nombre) {

    try {

        return crearStmt.get(nombre);

    } catch (error) {

        if (esErrorDuplicado(error)) {

            throw new Error(
                "Ya existe una categoría con ese nombre."
            );

        }

        throw error;
    }

}


export function actualizarCategoria(
    id,
    nombre
) {

    try {

        const categoria =
            actualizarStmt.get(
                nombre,
                id
            );


        if (!categoria) {

            throw new Error(
                "La categoría no existe."
            );

        }


        return categoria;

    } catch (error) {

        if (esErrorDuplicado(error)) {

            throw new Error(
                "Ya existe otra categoría con ese nombre."
            );

        }

        throw error;
    }

}


const eliminarCategoriaTransaction =
    db.transaction((id) => {

        const tieneSubcategorias =
            tieneSubcategoriasStmt.get(id);


        if (tieneSubcategorias) {

            throw new Error(
                "No se puede eliminar la categoría porque contiene subcategorías activas."
            );

        }


        const categoria =
            eliminarStmt.get(id);


        if (!categoria) {

            throw new Error(
                "La categoría no existe o ya fue eliminada."
            );

        }


        return {
            success: true,
            id: categoria.id
        };

    });


export function eliminarCategoria(id) {

    return eliminarCategoriaTransaction(id);

}