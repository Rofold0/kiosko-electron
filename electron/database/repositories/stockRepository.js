import db
    from "../database.js";


const productoStmt =
    db.prepare(`
        SELECT
            id,
            nombre,
            codigo,
            stock_actual,
            stock_minimo,
            unidad

        FROM productos

        WHERE
            id = ?
            AND activo = 1
    `);


const actualizarStockStmt =
    db.prepare(`
        UPDATE productos

        SET stock_actual = ?

        WHERE
            id = ?
            AND activo = 1
    `);


const movimientoStmt =
    db.prepare(`
        INSERT INTO movimientos_stock (

            producto_id,
            tipo,
            cantidad,
            stock_anterior,
            stock_nuevo,
            motivo,
            fecha

        )

        VALUES (
            ?, ?, ?, ?, ?, ?, ?
        )

        RETURNING
            id,
            producto_id,
            tipo,
            cantidad,
            stock_anterior,
            stock_nuevo,
            motivo,
            fecha
    `);


const movimientosStmt =
    db.prepare(`
        SELECT
            m.id,
            m.producto_id,
            p.nombre AS producto_nombre,
            p.codigo AS producto_codigo,

            m.tipo,
            m.cantidad,
            m.stock_anterior,
            m.stock_nuevo,
            m.motivo,
            m.fecha

        FROM movimientos_stock m

        INNER JOIN productos p
            ON p.id =
                m.producto_id

        WHERE
            m.producto_id = ?

        ORDER BY
            m.fecha DESC,
            m.id DESC

        LIMIT ?
        OFFSET ?
    `);


const contarMovimientosStmt =
    db.prepare(`
        SELECT
            COUNT(*) AS total

        FROM movimientos_stock

        WHERE producto_id = ?
    `);


const stockBajoStmt =
    db.prepare(`
        SELECT
            id,
            nombre,
            codigo,
            stock_actual,
            stock_minimo,
            unidad

        FROM productos

        WHERE
            activo = 1
            AND stock_minimo > 0
            AND stock_actual <= stock_minimo

        ORDER BY
            stock_actual - stock_minimo ASC,
            nombre COLLATE NOCASE ASC

        LIMIT 100
    `);


function obtenerProducto(id) {

    const producto =
        productoStmt.get(id);


    if (!producto) {

        throw new Error(
            "El producto no existe."
        );

    }


    return producto;
}


const registrarCambioTransaction =
    db.transaction(({
        productoId,
        tipo,
        cantidad,
        motivo
    }) => {

        const producto =
            obtenerProducto(
                productoId
            );


        let diferencia;


        if (tipo === "ENTRADA") {

            diferencia =
                cantidad;

        } else if (
            tipo === "SALIDA"
        ) {

            diferencia =
                -cantidad;

        } else {

            throw new Error(
                "Tipo de movimiento inválido."
            );

        }


        const stockNuevo =
            producto.stock_actual +
            diferencia;


        if (stockNuevo < 0) {

            throw new Error(
                "No hay stock suficiente para realizar la salida."
            );

        }


        actualizarStockStmt.run(
            stockNuevo,
            productoId
        );


        const movimiento =
            movimientoStmt.get(

                productoId,

                tipo,

                diferencia,

                producto.stock_actual,

                stockNuevo,

                motivo,

                new Date().toISOString()

            );


        return {

            producto: {
                ...producto,
                stock_actual:
                    stockNuevo
            },

            movimiento

        };

    });


export function registrarEntrada({
    productoId,
    cantidad,
    motivo
}) {

    return registrarCambioTransaction({

        productoId,

        tipo: "ENTRADA",

        cantidad,

        motivo

    });

}


export function registrarSalida({
    productoId,
    cantidad,
    motivo
}) {

    return registrarCambioTransaction({

        productoId,

        tipo: "SALIDA",

        cantidad,

        motivo

    });

}


const ajustarStockTransaction =
    db.transaction(({
        productoId,
        nuevoStock,
        motivo
    }) => {

        const producto =
            obtenerProducto(
                productoId
            );


        const diferencia =
            nuevoStock -
            producto.stock_actual;


        if (diferencia === 0) {

            throw new Error(
                "El nuevo stock es igual al stock actual."
            );

        }


        actualizarStockStmt.run(
            nuevoStock,
            productoId
        );


        const movimiento =
            movimientoStmt.get(

                productoId,

                "AJUSTE",

                diferencia,

                producto.stock_actual,

                nuevoStock,

                motivo,

                new Date().toISOString()

            );


        return {

            producto: {
                ...producto,
                stock_actual:
                    nuevoStock
            },

            movimiento

        };

    });


export function ajustarStock({
    productoId,
    nuevoStock,
    motivo
}) {

    return ajustarStockTransaction({

        productoId,
        nuevoStock,
        motivo

    });

}


export function listarMovimientos({
    productoId,
    limite = 50,
    offset = 0
}) {

    const items =
        movimientosStmt.all(

            productoId,

            limite,

            offset

        );


    const {
        total
    } =
        contarMovimientosStmt.get(
            productoId
        );


    return {
        items,
        total
    };

}


export function listarStockBajo() {

    return stockBajoStmt.all();

}