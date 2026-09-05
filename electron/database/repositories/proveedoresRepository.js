import db
    from "../database.js";


const listarStmt =
    db.prepare(`
        SELECT
            id,
            nombre,
            telefono,
            direccion,
            notas

        FROM proveedores

        WHERE activo = 1

        ORDER BY
            nombre COLLATE NOCASE ASC
    `);


const obtenerStmt =
    db.prepare(`
        SELECT
            id,
            nombre,
            telefono,
            direccion,
            notas

        FROM proveedores

        WHERE
            id = ?
            AND activo = 1
    `);


const crearStmt =
    db.prepare(`
        INSERT INTO proveedores (
            nombre,
            telefono,
            direccion,
            notas
        )

        VALUES (
            ?, ?, ?, ?
        )

        RETURNING
            id,
            nombre,
            telefono,
            direccion,
            notas
    `);


const actualizarStmt =
    db.prepare(`
        UPDATE proveedores

        SET
            nombre = ?,
            telefono = ?,
            direccion = ?,
            notas = ?

        WHERE
            id = ?
            AND activo = 1

        RETURNING
            id,
            nombre,
            telefono,
            direccion,
            notas
    `);


const eliminarStmt =
    db.prepare(`
        UPDATE proveedores

        SET activo = 0

        WHERE
            id = ?
            AND activo = 1

        RETURNING id
    `);


const productoActivoStmt =
    db.prepare(`
        SELECT
            id,
            nombre,
            codigo

        FROM productos

        WHERE
            id = ?
            AND activo = 1
    `);


const proveedorActivoStmt =
    db.prepare(`
        SELECT id

        FROM proveedores

        WHERE
            id = ?
            AND activo = 1
    `);


const productosProveedorStmt =
    db.prepare(`
        SELECT
            pp.id,
            pp.producto_id,
            pp.proveedor_id,
            pp.codigo_proveedor,
            pp.ultimo_costo,
            pp.notas,

            p.nombre
                AS producto_nombre,

            p.codigo
                AS producto_codigo

        FROM productos_proveedores pp

        INNER JOIN productos p
            ON p.id = pp.producto_id

        WHERE
            pp.proveedor_id = ?
            AND p.activo = 1

        ORDER BY
            p.nombre COLLATE NOCASE ASC
    `);


const proveedoresProductoStmt =
    db.prepare(`
        SELECT
            pp.id,
            pp.proveedor_id,
            pp.producto_id,
            pp.codigo_proveedor,
            pp.ultimo_costo,
            pp.notas,

            pr.nombre
                AS proveedor_nombre,

            pr.telefono
                AS proveedor_telefono

        FROM productos_proveedores pp

        INNER JOIN proveedores pr
            ON pr.id = pp.proveedor_id

        WHERE
            pp.producto_id = ?
            AND pr.activo = 1

        ORDER BY
            pr.nombre COLLATE NOCASE ASC
    `);


const vincularStmt =
    db.prepare(`
        INSERT INTO productos_proveedores (
            producto_id,
            proveedor_id,
            codigo_proveedor,
            ultimo_costo,
            notas
        )

        VALUES (
            ?, ?, ?, ?, ?
        )

        RETURNING id
    `);


const vinculoStmt =
    db.prepare(`
        SELECT
            pp.id,
            pp.producto_id,
            pp.proveedor_id

        FROM productos_proveedores pp

        INNER JOIN proveedores pr
            ON pr.id = pp.proveedor_id

        INNER JOIN productos p
            ON p.id = pp.producto_id

        WHERE
            pp.id = ?
            AND pr.activo = 1
            AND p.activo = 1
    `);


const actualizarVinculoStmt =
    db.prepare(`
        UPDATE productos_proveedores

        SET
            codigo_proveedor = ?,
            ultimo_costo = ?,
            notas = ?

        WHERE id = ?
    `);


const eliminarVinculoStmt =
    db.prepare(`
        DELETE FROM productos_proveedores

        WHERE id = ?
    `);


function esDuplicado(error) {

    return (
        error?.code ===
        "SQLITE_CONSTRAINT_UNIQUE"
    );

}


function obtenerProveedor(id) {

    const proveedor =
        obtenerStmt.get(id);


    if (!proveedor) {

        throw new Error(
            "El proveedor no existe."
        );

    }


    return proveedor;

}


export function listarProveedores() {

    return listarStmt.all();

}


export function crearProveedor({
    nombre,
    telefono,
    direccion,
    notas
}) {

    try {

        return crearStmt.get(
            nombre,
            telefono,
            direccion,
            notas
        );


    } catch (error) {

        if (esDuplicado(error)) {

            throw new Error(
                "Ya existe un proveedor con ese nombre."
            );

        }


        throw error;

    }

}


export function actualizarProveedor({
    id,
    nombre,
    telefono,
    direccion,
    notas
}) {

    try {

        const proveedor =
            actualizarStmt.get(
                nombre,
                telefono,
                direccion,
                notas,
                id
            );


        if (!proveedor) {

            throw new Error(
                "El proveedor no existe."
            );

        }


        return proveedor;


    } catch (error) {

        if (esDuplicado(error)) {

            throw new Error(
                "Ya existe otro proveedor con ese nombre."
            );

        }


        throw error;

    }

}


export function eliminarProveedor(id) {

    const resultado =
        eliminarStmt.get(id);


    if (!resultado) {

        throw new Error(
            "El proveedor no existe o ya fue eliminado."
        );

    }


    return {
        success: true,
        id: resultado.id
    };

}


export function listarProductosProveedor(
    proveedorId
) {

    obtenerProveedor(
        proveedorId
    );


    return productosProveedorStmt.all(
        proveedorId
    );

}


export function listarProveedoresProducto(
    productoId
) {

    const producto =
        productoActivoStmt.get(
            productoId
        );


    if (!producto) {

        throw new Error(
            "El producto no existe."
        );

    }


    return proveedoresProductoStmt.all(
        productoId
    );

}


export function vincularProducto({
    proveedorId,
    productoId,
    codigoProveedor,
    ultimoCosto,
    notas
}) {

    const proveedor =
        proveedorActivoStmt.get(
            proveedorId
        );


    if (!proveedor) {

        throw new Error(
            "El proveedor no existe."
        );

    }


    const producto =
        productoActivoStmt.get(
            productoId
        );


    if (!producto) {

        throw new Error(
            "El producto no existe."
        );

    }


    try {

        const resultado =
            vincularStmt.get(
                productoId,
                proveedorId,
                codigoProveedor,
                ultimoCosto,
                notas
            );


        return {
            success: true,
            id: resultado.id
        };


    } catch (error) {

        if (esDuplicado(error)) {

            throw new Error(
                "Este producto ya está vinculado al proveedor."
            );

        }


        throw error;

    }

}


export function actualizarVinculo({
    id,
    codigoProveedor,
    ultimoCosto,
    notas
}) {

    const vinculo =
        vinculoStmt.get(id);


    if (!vinculo) {

        throw new Error(
            "La relación producto-proveedor no existe."
        );

    }


    actualizarVinculoStmt.run(
        codigoProveedor,
        ultimoCosto,
        notas,
        id
    );


    return {
        success: true,
        id
    };

}


export function desvincularProducto(id) {

    const vinculo =
        vinculoStmt.get(id);


    if (!vinculo) {

        throw new Error(
            "La relación producto-proveedor no existe."
        );

    }


    eliminarVinculoStmt.run(id);


    return {
        success: true,
        id
    };

}