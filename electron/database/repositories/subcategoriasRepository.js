import db from "../database.js";


const listarStmt = db.prepare(`
    SELECT
        s.id,
        s.nombre,
        s.categoria_id,
        c.nombre AS categoria_nombre

    FROM subcategorias s

    INNER JOIN categorias c
        ON c.id = s.categoria_id

    WHERE
        s.activo = 1
        AND c.activo = 1

    ORDER BY
        c.nombre COLLATE NOCASE ASC,
        s.nombre COLLATE NOCASE ASC
`);


const categoriaActivaStmt = db.prepare(`
    SELECT
        id,
        nombre

    FROM categorias

    WHERE id = ?
      AND activo = 1
`);


const crearStmt = db.prepare(`
    INSERT INTO subcategorias (
        categoria_id,
        nombre
    )

    VALUES (?, ?)

    RETURNING
        id,
        categoria_id,
        nombre
`);


const actualizarStmt = db.prepare(`
    UPDATE subcategorias

    SET
        categoria_id = ?,
        nombre = ?

    WHERE id = ?
      AND activo = 1

    RETURNING
        id,
        categoria_id,
        nombre
`);


const eliminarStmt = db.prepare(`
    UPDATE subcategorias

    SET activo = 0

    WHERE id = ?
      AND activo = 1

    RETURNING id
`);


function esErrorDuplicado(error) {

    return (
        error?.code ===
        "SQLITE_CONSTRAINT_UNIQUE"
    );

}


export function listarSubcategorias() {

    return listarStmt.all();

}


export function crearSubcategoria(
    categoriaId,
    nombre
) {

    const categoria =
        categoriaActivaStmt.get(
            categoriaId
        );


    if (!categoria) {

        throw new Error(
            "La categoría seleccionada no existe."
        );

    }


    try {

        const subcategoria =
            crearStmt.get(
                categoriaId,
                nombre
            );


        return {
            ...subcategoria,

            categoria_nombre:
                categoria.nombre
        };

    } catch (error) {

        if (esErrorDuplicado(error)) {

            throw new Error(
                "Ya existe esa subcategoría dentro de la categoría seleccionada."
            );

        }

        throw error;

    }

}


export function actualizarSubcategoria(
    id,
    categoriaId,
    nombre
) {

    const categoria =
        categoriaActivaStmt.get(
            categoriaId
        );


    if (!categoria) {

        throw new Error(
            "La categoría seleccionada no existe."
        );

    }


    try {

        const subcategoria =
            actualizarStmt.get(
                categoriaId,
                nombre,
                id
            );


        if (!subcategoria) {

            throw new Error(
                "La subcategoría no existe."
            );

        }


        return {
            ...subcategoria,

            categoria_nombre:
                categoria.nombre
        };

    } catch (error) {

        if (esErrorDuplicado(error)) {

            throw new Error(
                "Ya existe esa subcategoría dentro de la categoría seleccionada."
            );

        }

        throw error;

    }

}


export function eliminarSubcategoria(id) {

    const resultado =
        eliminarStmt.get(id);


    if (!resultado) {

        throw new Error(
            "La subcategoría no existe o ya fue eliminada."
        );

    }


    return {
        success: true,
        id: resultado.id
    };

}