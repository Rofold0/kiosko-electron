import db
    from "../database.js";


const obtenerStmt =
    db.prepare(`
        SELECT
            p.id,
            p.nombre,
            p.descripcion,
            p.codigo,
            p.categoria_id,
            p.subcategoria_id,
            p.stock_actual,
            p.stock_minimo,
            p.unidad,

            c.nombre
                AS categoria_nombre,

            s.nombre
                AS subcategoria_nombre

        FROM productos p

        LEFT JOIN categorias c
            ON c.id =
                p.categoria_id

        LEFT JOIN subcategorias s
            ON s.id =
                p.subcategoria_id

        WHERE
            p.id = ?
            AND p.activo = 1
    `);


const listarStmt =
    db.prepare(`
        SELECT
            p.id,
            p.nombre,
            p.descripcion,
            p.codigo,
            p.categoria_id,
            p.subcategoria_id,
            p.stock_actual,
            p.stock_minimo,
            p.unidad,

            c.nombre
                AS categoria_nombre,

            s.nombre
                AS subcategoria_nombre

        FROM productos p

        LEFT JOIN categorias c
            ON c.id =
                p.categoria_id

        LEFT JOIN subcategorias s
            ON s.id =
                p.subcategoria_id

        WHERE
            p.activo = 1

            AND (
                @busqueda = ''
                OR
                p.nombre COLLATE NOCASE
                    LIKE @patron

                OR

                COALESCE(
                    p.codigo,
                    ''
                ) COLLATE NOCASE
                    LIKE @patron
            )

            AND (
                @categoriaId IS NULL
                OR
                p.categoria_id =
                    @categoriaId
            )

            AND (
                @subcategoriaId IS NULL
                OR
                p.subcategoria_id =
                    @subcategoriaId
            )

        ORDER BY
            p.nombre
                COLLATE NOCASE ASC

        LIMIT @limite
        OFFSET @offset
    `);


const contarStmt =
    db.prepare(`
        SELECT
            COUNT(*) AS total

        FROM productos p

        WHERE
            p.activo = 1

            AND (
                @busqueda = ''
                OR
                p.nombre COLLATE NOCASE
                    LIKE @patron

                OR

                COALESCE(
                    p.codigo,
                    ''
                ) COLLATE NOCASE
                    LIKE @patron
            )

            AND (
                @categoriaId IS NULL
                OR
                p.categoria_id =
                    @categoriaId
            )

            AND (
                @subcategoriaId IS NULL
                OR
                p.subcategoria_id =
                    @subcategoriaId
            )
    `);


const categoriaActivaStmt =
    db.prepare(`
        SELECT id
        FROM categorias

        WHERE
            id = ?
            AND activo = 1
    `);


const subcategoriaValidaStmt =
    db.prepare(`
        SELECT id
        FROM subcategorias

        WHERE
            id = ?
            AND categoria_id = ?
            AND activo = 1
    `);


const crearStmt =
    db.prepare(`
        INSERT INTO productos (

            nombre,
            descripcion,
            codigo,
            categoria_id,
            subcategoria_id,
            stock_actual,
            stock_minimo,
            unidad

        )

        VALUES (
            ?, ?, ?, ?, ?, ?, ?, ?
        )

        RETURNING id
    `);


const actualizarStmt =
    db.prepare(`
        UPDATE productos

        SET
            nombre = ?,
            descripcion = ?,
            codigo = ?,
            categoria_id = ?,
            subcategoria_id = ?,
            stock_minimo = ?,
            unidad = ?

        WHERE
            id = ?
            AND activo = 1

        RETURNING id
    `);


const eliminarStmt =
    db.prepare(`
        UPDATE productos

        SET activo = 0

        WHERE
            id = ?
            AND activo = 1

        RETURNING id
    `);


function validarRelaciones(
    categoriaId,
    subcategoriaId
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


    if (subcategoriaId !== null) {

        const subcategoria =
            subcategoriaValidaStmt.get(
                subcategoriaId,
                categoriaId
            );


        if (!subcategoria) {

            throw new Error(
                "La subcategoría no pertenece a la categoría seleccionada."
            );

        }

    }

}


function esCodigoDuplicado(error) {

    return (
        error?.code ===
        "SQLITE_CONSTRAINT_UNIQUE"
    );

}


export function listarProductos({
    busqueda = "",
    categoriaId = null,
    subcategoriaId = null,
    limite = 50,
    offset = 0
}) {

    const patron =
        `%${busqueda}%`;


    const parametros = {

        busqueda,

        patron,

        categoriaId,

        subcategoriaId,

        limite,

        offset

    };


    const items =
        listarStmt.all(
            parametros
        );


    const {
        total
    } =
        contarStmt.get(
            parametros
        );


    return {
        items,
        total
    };

}


export function crearProducto({
    nombre,
    descripcion,
    codigo,
    categoriaId,
    subcategoriaId,
    stockInicial,
    stockMinimo,
    unidad
}) {

    validarRelaciones(
        categoriaId,
        subcategoriaId
    );


    try {

        const resultado =
            crearStmt.get(

                nombre,
                descripcion,
                codigo,
                categoriaId,
                subcategoriaId,
                stockInicial,
                stockMinimo,
                unidad

            );


        return obtenerStmt.get(
            resultado.id
        );


    } catch (error) {

        if (
            esCodigoDuplicado(
                error
            )
        ) {

            throw new Error(
                "Ya existe un producto con ese código."
            );

        }


        throw error;

    }

}


export function actualizarProducto({
    id,
    nombre,
    descripcion,
    codigo,
    categoriaId,
    subcategoriaId,
    stockMinimo,
    unidad
}) {

    validarRelaciones(
        categoriaId,
        subcategoriaId
    );


    try {

        const resultado =
            actualizarStmt.get(

                nombre,
                descripcion,
                codigo,
                categoriaId,
                subcategoriaId,
                stockMinimo,
                unidad,
                id

            );


        if (!resultado) {

            throw new Error(
                "El producto no existe."
            );

        }


        return obtenerStmt.get(
            resultado.id
        );


    } catch (error) {

        if (
            esCodigoDuplicado(
                error
            )
        ) {

            throw new Error(
                "Ya existe otro producto con ese código."
            );

        }


        throw error;

    }

}


export function eliminarProducto(id) {

    const resultado =
        eliminarStmt.get(id);


    if (!resultado) {

        throw new Error(
            "El producto no existe o ya fue eliminado."
        );

    }


    return {
        success: true,
        id: resultado.id
    };

}