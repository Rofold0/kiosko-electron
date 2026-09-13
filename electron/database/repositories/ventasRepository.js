import db
    from "../database.js";

const cajaAbiertaStmt =
    db.prepare(`
        SELECT
            id,
            fecha_apertura

        FROM cajas

        WHERE estado = 'ABIERTA'

        LIMIT 1
    `);

const buscarProductosStmt =
    db.prepare(`
        SELECT
            p.id
                AS producto_id,

            p.nombre
                AS producto_nombre,

            p.codigo
                AS producto_codigo,

            p.stock_actual,
            p.unidad,

            pr.id
                AS precio_id,

            pr.costo,
            pr.precio_venta

        FROM productos p

        INNER JOIN precios pr
            ON pr.producto_id = p.id
            AND pr.fecha_hasta IS NULL

        WHERE
            p.activo = 1

            AND (
                @busqueda = ''

                OR

                p.nombre
                    COLLATE NOCASE
                    LIKE @patron

                OR

                COALESCE(
                    p.codigo,
                    ''
                )
                    COLLATE NOCASE
                    LIKE @patron
            )

        ORDER BY

            CASE
                WHEN
                    LOWER(
                        COALESCE(
                            p.codigo,
                            ''
                        )
                    ) =
                    LOWER(@busqueda)
                THEN 0
                ELSE 1
            END,

            p.nombre
                COLLATE NOCASE ASC

        LIMIT @limite
    `);


const productoVentaStmt =
    db.prepare(`
        SELECT
            p.id,
            p.nombre,
            p.codigo,
            p.stock_actual,
            p.unidad,

            pr.id
                AS precio_id,

            pr.costo,
            pr.precio_venta

        FROM productos p

        INNER JOIN precios pr
            ON pr.producto_id = p.id
            AND pr.fecha_hasta IS NULL

        WHERE
            p.id = ?
            AND p.activo = 1
    `);


const crearVentaStmt =
    db.prepare(`
        INSERT INTO ventas (
            fecha,
            total,
            metodo_pago,
            efectivo_recibido,
            vuelto,
            notas
        )

        VALUES (
            ?, ?, ?, ?, ?, ?
        )

        RETURNING id
    `);


const crearItemStmt =
    db.prepare(`
        INSERT INTO items_venta (
            venta_id,
            producto_id,
            precio_id,
            cantidad,
            costo_unitario,
            precio_unitario,
            subtotal
        )

        VALUES (
            ?, ?, ?, ?, ?, ?, ?
        )
    `);


const actualizarStockStmt =
    db.prepare(`
        UPDATE productos

        SET stock_actual = ?

        WHERE id = ?
    `);


const movimientoStockStmt =
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
    `);


const movimientoCajaStmt =
    db.prepare(`
        INSERT INTO movimientos_caja (
            tipo,
            concepto,
            monto,
            fecha,

            caja_id,
            metodo_pago,

            venta_id,
            gasto_id,

            movimiento_origen_id,

            notas
        )

        VALUES (
            ?, ?, ?, ?,
            ?, ?,
            ?, NULL,
            NULL,
            ?
        )
    `);


const listarVentasStmt =
    db.prepare(`
        SELECT
            v.id,
            v.fecha,
            v.total,
            v.metodo_pago,
            v.efectivo_recibido,
            v.vuelto,
            v.notas,
            v.estado,
            v.fecha_reversion,
            v.motivo_reversion,

            COUNT(iv.id)
                AS total_items,

            COALESCE(
                SUM(iv.cantidad),
                0
            ) AS total_unidades,

            ROUND(
                COALESCE(
                    SUM(
                        (
                            iv.precio_unitario -
                            iv.costo_unitario
                        ) *
                        iv.cantidad
                    ),
                    0
                ),
                2
            ) AS ganancia

        FROM ventas v

        LEFT JOIN items_venta iv
            ON iv.venta_id = v.id

        WHERE
            (
                @metodoPago IS NULL
                OR
                v.metodo_pago =
                    @metodoPago
            )

            AND
            (
                @estado IS NULL
                OR
                v.estado =
                    @estado
            )

        GROUP BY v.id

        ORDER BY
            v.fecha DESC,
            v.id DESC

        LIMIT @limite
        OFFSET @offset
    `);


const contarVentasStmt =
    db.prepare(`
        SELECT
            COUNT(*) AS total

        FROM ventas

        WHERE
            (
                @metodoPago IS NULL
                OR
                metodo_pago =
                    @metodoPago
            )

            AND
            (
                @estado IS NULL
                OR
                estado =
                    @estado
            )
    `);


const ventaStmt =
    db.prepare(`
        SELECT
            id,
            fecha,
            total,
            metodo_pago,
            efectivo_recibido,
            vuelto,
            notas,
            estado,
            fecha_reversion,
            motivo_reversion

        FROM ventas

        WHERE id = ?
    `);


const itemsVentaStmt =
    db.prepare(`
        SELECT
            iv.id,
            iv.producto_id,
            iv.precio_id,
            iv.cantidad,
            iv.costo_unitario,
            iv.precio_unitario,
            iv.subtotal,

            p.nombre
                AS producto_nombre,

            p.codigo
                AS producto_codigo,

            p.unidad,

            ROUND(
                (
                    iv.precio_unitario -
                    iv.costo_unitario
                ) *
                iv.cantidad,
                2
            ) AS ganancia

        FROM items_venta iv

        INNER JOIN productos p
            ON p.id =
                iv.producto_id

        WHERE
            iv.venta_id = ?

        ORDER BY
            iv.id ASC
    `);


const marcarRevertidaStmt =
    db.prepare(`
        UPDATE ventas

        SET
            estado = 'REVERTIDA',
            fecha_reversion = ?,
            motivo_reversion = ?

        WHERE
            id = ?
            AND estado = 'ACTIVA'
    `);


const itemsReversionStmt =
    db.prepare(`
        SELECT
            iv.producto_id,
            iv.cantidad,

            p.nombre
                AS producto_nombre,

            p.stock_actual

        FROM items_venta iv

        INNER JOIN productos p
            ON p.id =
                iv.producto_id

        WHERE iv.venta_id = ?
    `);


function redondear(valor) {

    return Math.round(
        (
            Number(valor) +
            Number.EPSILON
        ) * 100
    ) / 100;

}


function obtenerVentaCompleta(id) {

    const venta =
        ventaStmt.get(id);


    if (!venta) {

        throw new Error(
            "La venta no existe."
        );

    }


    const items =
        itemsVentaStmt.all(id);


    const ganancia =
        redondear(
            items.reduce(
                (
                    total,
                    item
                ) =>
                    total +
                    Number(
                        item.ganancia
                    ),
                0
            )
        );


    return {
        ...venta,
        ganancia,
        items
    };

}


export function buscarProductosVenta({
    busqueda = "",
    limite = 30
}) {

    const texto =
        busqueda.trim();


    return buscarProductosStmt.all({

        busqueda:
            texto,

        patron:
            `%${texto}%`,

        limite

    });

}


const registrarVentaTransaction =
    db.transaction(({
        fecha,
        metodoPago,
        efectivoRecibido,
        notas,
        items
    }) => {

        const caja =
            cajaAbiertaStmt.get();


        if (!caja) {

            throw new Error(
                "Debe abrir la caja antes de registrar una venta."
            );

        }


        const fechaVenta =
            new Date(
                fecha
            );


        const fechaApertura =
            new Date(
                caja.fecha_apertura
            );


        if (
            Number.isNaN(
                fechaVenta.getTime()
            ) ||
            Number.isNaN(
                fechaApertura.getTime()
            )
        ) {

            throw new Error(
                "No se pudo validar la fecha de la venta."
            );

        }


        const minutoVenta =
            new Date(
                fechaVenta
            );


        minutoVenta.setSeconds(
            0,
            0
        );


        const minutoApertura =
            new Date(
                fechaApertura
            );


        minutoApertura.setSeconds(
            0,
            0
        );


        if (
            minutoVenta <
            minutoApertura
        ) {

            throw new Error(
                "La fecha de venta no puede ser anterior a la apertura de caja."
            );

        }


        const ahora =
            new Date();


        if (
            fechaVenta.getTime() >
            ahora.getTime() +
            60_000
        ) {

            throw new Error(
                "La fecha de venta no puede estar en el futuro."
            );

        }

        if (
            !Array.isArray(items) ||
            items.length === 0
        ) {

            throw new Error(
                "La venta no tiene productos."
            );

        }


        const usados =
            new Set();


        const normalizados =
            items.map(
                (item) => {

                    if (
                        usados.has(
                            item.productoId
                        )
                    ) {

                        throw new Error(
                            "Hay productos repetidos en la venta."
                        );

                    }


                    usados.add(
                        item.productoId
                    );


                    const producto =
                        productoVentaStmt.get(
                            item.productoId
                        );


                    if (!producto) {

                        throw new Error(
                            "Uno de los productos no existe o no tiene precio vigente."
                        );

                    }


                    if (
                        producto.precio_id !==
                        item.precioId
                    ) {

                        throw new Error(
                            `El precio de ${producto.nombre} cambió. Actualizá el carrito.`
                        );

                    }


                    if (
                        producto.stock_actual <
                        item.cantidad
                    ) {

                        throw new Error(
                            `No hay stock suficiente de ${producto.nombre}. Stock actual: ${producto.stock_actual}.`
                        );

                    }


                    const subtotal =
                        redondear(
                            producto.precio_venta *
                            item.cantidad
                        );


                    return {

                        producto,

                        cantidad:
                            item.cantidad,

                        subtotal

                    };

                }
            );


        const total =
            redondear(
                normalizados.reduce(
                    (
                        acumulado,
                        item
                    ) =>
                        acumulado +
                        item.subtotal,
                    0
                )
            );

        let recibido =
            null;


        let vuelto =
            null;


        if (
            metodoPago ===
            "EFECTIVO"
        ) {

            if (
                efectivoRecibido === null ||
                efectivoRecibido ===
                undefined ||
                efectivoRecibido ===
                ""
            ) {

                throw new Error(
                    "Debe indicar el efectivo recibido."
                );

            }


            recibido =
                redondear(
                    efectivoRecibido
                );


            if (
                !Number.isFinite(
                    recibido
                ) ||
                recibido < 0
            ) {

                throw new Error(
                    "El efectivo recibido es inválido."
                );

            }


            if (
                recibido <
                total
            ) {

                throw new Error(
                    `El efectivo recibido es menor al total de la venta. Faltan $${redondear(
                        total -
                        recibido
                    ).toFixed(2)}.`
                );

            }


            vuelto =
                redondear(
                    recibido -
                    total
                );

        }


        const venta =
            crearVentaStmt.get(

                fecha,

                total,

                metodoPago,

                recibido,

                vuelto,

                notas

            );


        for (
            const item
            of normalizados
        ) {

            const producto =
                item.producto;


            crearItemStmt.run(

                venta.id,

                producto.id,

                producto.precio_id,

                item.cantidad,

                producto.costo,

                producto.precio_venta,

                item.subtotal

            );


            const stockAnterior =
                producto.stock_actual;


            const stockNuevo =
                stockAnterior -
                item.cantidad;


            actualizarStockStmt.run(

                stockNuevo,

                producto.id

            );

            movimientoStockStmt.run(

                producto.id,

                "VENTA",

                -item.cantidad,

                stockAnterior,

                stockNuevo,

                `Venta #${venta.id}`,

                fecha

            );

        }

        const conceptoCaja =
            metodoPago ===
                "EFECTIVO"
                ? (
                    `Venta #${venta.id} · ` +
                    `EFECTIVO · ` +
                    `Recibido $${recibido.toFixed(2)} · ` +
                    `Vuelto $${vuelto.toFixed(2)}`
                )
                : (
                    `Venta #${venta.id} · ` +
                    metodoPago
                );

        movimientoCajaStmt.run(

            "VENTA",

            conceptoCaja,

            total,

            fecha,

            caja.id,

            metodoPago,

            venta.id,

            notas

        );


        return obtenerVentaCompleta(
            venta.id
        );

    });


export function registrarVenta(datos) {

    return registrarVentaTransaction(
        datos
    );

}


export function listarVentas({
    metodoPago = null,
    estado = null,
    limite = 25,
    offset = 0
}) {

    const parametros = {

        metodoPago,
        estado,
        limite,
        offset

    };


    const items =
        listarVentasStmt.all(
            parametros
        );


    const {
        total
    } =
        contarVentasStmt.get(
            parametros
        );


    return {
        items,
        total
    };

}


export function obtenerVenta(id) {

    return obtenerVentaCompleta(
        id
    );

}


const revertirVentaTransaction =
    db.transaction(({
        ventaId,
        motivo
    }) => {
        const caja =
            cajaAbiertaStmt.get();


        if (!caja) {

            throw new Error(
                "Debe haber una caja abierta para revertir la venta."
            );

        }

        const venta =
            ventaStmt.get(
                ventaId
            );


        if (!venta) {

            throw new Error(
                "La venta no existe."
            );

        }


        if (
            venta.estado ===
            "REVERTIDA"
        ) {

            throw new Error(
                "La venta ya fue revertida."
            );

        }


        const items =
            itemsReversionStmt.all(
                ventaId
            );


        if (
            items.length === 0
        ) {

            throw new Error(
                "La venta no tiene productos."
            );

        }


        const fecha =
            new Date()
                .toISOString();


        for (
            const item
            of items
        ) {

            const stockAnterior =
                item.stock_actual;


            const stockNuevo =
                stockAnterior +
                item.cantidad;


            actualizarStockStmt.run(

                stockNuevo,

                item.producto_id

            );


            movimientoStockStmt.run(

                item.producto_id,

                "REVERSA_VENTA",

                item.cantidad,

                stockAnterior,

                stockNuevo,

                `Reversión venta #${venta.id}: ${motivo}`,

                fecha

            );

        }


        movimientoCajaStmt.run(

            "REVERSA_VENTA",

            `Reversión venta #${venta.id}`,

            -venta.total,

            fecha,

            caja.id,

            venta.metodo_pago,

            venta.id,

            motivo

        );


        const resultado =
            marcarRevertidaStmt.run(

                fecha,

                motivo,

                venta.id

            );


        if (
            resultado.changes !== 1
        ) {

            throw new Error(
                "No se pudo revertir la venta."
            );

        }


        return obtenerVentaCompleta(
            venta.id
        );

    });


export function revertirVenta(datos) {

    return revertirVentaTransaction(
        datos
    );

}