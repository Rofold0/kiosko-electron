import db
    from "../database.js";


const ventasResumenStmt =
    db.prepare(`
        SELECT
            COUNT(*) AS total_ventas,

            ROUND(
                COALESCE(
                    SUM(total),
                    0
                ),
                2
            ) AS facturacion,

            ROUND(
                COALESCE(
                    AVG(total),
                    0
                ),
                2
            ) AS ticket_promedio

        FROM ventas

        WHERE
            estado = 'ACTIVA'
            AND fecha >= @desde
            AND fecha < @hasta
    `);


const itemsResumenStmt =
    db.prepare(`
        SELECT
            COALESCE(
                SUM(iv.cantidad),
                0
            ) AS unidades,

            ROUND(
                COALESCE(
                    SUM(
                        iv.costo_unitario *
                        iv.cantidad
                    ),
                    0
                ),
                2
            ) AS costo_vendido,

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
            ) AS margen_bruto

        FROM items_venta iv

        INNER JOIN ventas v
            ON v.id = iv.venta_id

        WHERE
            v.estado = 'ACTIVA'
            AND v.fecha >= @desde
            AND v.fecha < @hasta
    `);


const gastosResumenStmt =
    db.prepare(`
        SELECT
            ROUND(
                COALESCE(
                    SUM(monto),
                    0
                ),
                2
            ) AS gastos

        FROM gastos

        WHERE
            estado = 'ACTIVO'
            AND fecha >= @desde
            AND fecha < @hasta
    `);


const cajaResumenStmt =
    db.prepare(`
        SELECT
            ROUND(
                COALESCE(
                    SUM(monto),
                    0
                ),
                2
            ) AS movimiento_neto,

            ROUND(
                COALESCE(
                    SUM(
                        CASE
                            WHEN metodo_pago =
                                'EFECTIVO'
                            THEN monto
                            ELSE 0
                        END
                    ),
                    0
                ),
                2
            ) AS efectivo_neto

        FROM movimientos_caja

        WHERE
            fecha >= @desde
            AND fecha < @hasta
    `);


/*
 * HORARIOS
 */

const ventasHoraStmt =
    db.prepare(`
        WITH ventas_hora AS (

            SELECT
                CAST(
                    strftime(
                        '%H',
                        datetime(
                            fecha,
                            'localtime'
                        )
                    )
                    AS INTEGER
                ) AS hora,

                COUNT(*) AS tickets,

                ROUND(
                    SUM(total),
                    2
                ) AS facturacion

            FROM ventas

            WHERE
                estado = 'ACTIVA'
                AND fecha >= @desde
                AND fecha < @hasta

            GROUP BY hora

        ),

        unidades_hora AS (

            SELECT
                CAST(
                    strftime(
                        '%H',
                        datetime(
                            v.fecha,
                            'localtime'
                        )
                    )
                    AS INTEGER
                ) AS hora,

                SUM(iv.cantidad)
                    AS unidades

            FROM ventas v

            INNER JOIN items_venta iv
                ON iv.venta_id = v.id

            WHERE
                v.estado = 'ACTIVA'
                AND v.fecha >= @desde
                AND v.fecha < @hasta

            GROUP BY hora
        )

        SELECT
            vh.hora,
            vh.tickets,

            COALESCE(
                uh.unidades,
                0
            ) AS unidades,

            vh.facturacion

        FROM ventas_hora vh

        LEFT JOIN unidades_hora uh
            ON uh.hora = vh.hora

        ORDER BY
            vh.hora ASC
    `);


/*
 * PRODUCTOS MÁS VENDIDOS
 * +
 * HORARIO PICO POR PRODUCTO
 */

const productosTopStmt =
    db.prepare(`
        WITH totales AS (

            SELECT
                iv.producto_id,

                p.nombre,

                SUM(iv.cantidad)
                    AS unidades,

                ROUND(
                    SUM(iv.subtotal),
                    2
                ) AS facturacion,

                ROUND(
                    SUM(
                        (
                            iv.precio_unitario -
                            iv.costo_unitario
                        ) *
                        iv.cantidad
                    ),
                    2
                ) AS margen_bruto

            FROM items_venta iv

            INNER JOIN ventas v
                ON v.id = iv.venta_id

            INNER JOIN productos p
                ON p.id =
                    iv.producto_id

            WHERE
                v.estado = 'ACTIVA'
                AND v.fecha >= @desde
                AND v.fecha < @hasta

            GROUP BY
                iv.producto_id,
                p.nombre
        ),

        ventas_hora AS (

            SELECT
                iv.producto_id,

                CAST(
                    strftime(
                        '%H',
                        datetime(
                            v.fecha,
                            'localtime'
                        )
                    )
                    AS INTEGER
                ) AS hora,

                SUM(iv.cantidad)
                    AS unidades_hora

            FROM items_venta iv

            INNER JOIN ventas v
                ON v.id = iv.venta_id

            WHERE
                v.estado = 'ACTIVA'
                AND v.fecha >= @desde
                AND v.fecha < @hasta

            GROUP BY
                iv.producto_id,
                hora
        ),

        ranking_hora AS (

            SELECT
                producto_id,
                hora,
                unidades_hora,

                ROW_NUMBER() OVER (
                    PARTITION BY
                        producto_id

                    ORDER BY
                        unidades_hora DESC,
                        hora ASC
                ) AS posicion

            FROM ventas_hora
        )

        SELECT
            t.producto_id,
            t.nombre,
            t.unidades,
            t.facturacion,
            t.margen_bruto,

            rh.hora
                AS hora_pico,

            rh.unidades_hora
                AS unidades_hora_pico

        FROM totales t

        LEFT JOIN ranking_hora rh
            ON rh.producto_id =
                t.producto_id
            AND rh.posicion = 1

        ORDER BY
            t.unidades DESC,
            t.facturacion DESC

        LIMIT @limite
    `);


/*
 * MÉTODOS DE PAGO
 */

const metodosPagoStmt =
    db.prepare(`
        SELECT
            COALESCE(
                metodo_pago,
                'OTRO'
            ) AS metodo_pago,

            COUNT(*)
                AS ventas,

            ROUND(
                SUM(total),
                2
            ) AS total

        FROM ventas

        WHERE
            estado = 'ACTIVA'
            AND fecha >= @desde
            AND fecha < @hasta

        GROUP BY
            metodo_pago

        ORDER BY
            total DESC
    `);


/*
 * STOCK SIN ROTACIÓN
 */

const sinRotacionStmt =
    db.prepare(`
        SELECT
            p.id,
            p.nombre,
            p.codigo,
            p.stock_actual,
            p.stock_minimo,

            COALESCE(
                pr.costo,
                0
            ) AS costo,

            ROUND(
                p.stock_actual *
                COALESCE(
                    pr.costo,
                    0
                ),
                2
            ) AS valor_stock

        FROM productos p

        LEFT JOIN precios pr
            ON pr.producto_id = p.id
            AND pr.fecha_hasta IS NULL

        WHERE
            p.activo = 1
            AND p.stock_actual > 0

            AND NOT EXISTS (

                SELECT 1

                FROM items_venta iv

                INNER JOIN ventas v
                    ON v.id =
                        iv.venta_id

                WHERE
                    iv.producto_id =
                        p.id

                    AND v.estado =
                        'ACTIVA'

                    AND v.fecha >=
                        @desde

                    AND v.fecha <
                        @hasta
            )

        ORDER BY
            valor_stock DESC,
            p.stock_actual DESC,
            p.nombre COLLATE NOCASE ASC

        LIMIT @limite
    `);


/*
 * BALANCE ÚLTIMOS 12 MESES
 */

const balanceMensualStmt =
    db.prepare(`
        WITH RECURSIVE meses(
            mes,
            numero
        ) AS (

            SELECT
                date(@mesInicial),
                0

            UNION ALL

            SELECT
                date(
                    mes,
                    '+1 month'
                ),

                numero + 1

            FROM meses

            WHERE numero < 11
        ),

        ventas_mes AS (

            SELECT
                strftime(
                    '%Y-%m',
                    datetime(
                        fecha,
                        'localtime'
                    )
                ) AS mes,

                ROUND(
                    SUM(total),
                    2
                ) AS ventas

            FROM ventas

            WHERE
                estado = 'ACTIVA'
                AND fecha >= @balanceDesde
                AND fecha < @hasta

            GROUP BY mes
        ),

        margen_mes AS (

            SELECT
                strftime(
                    '%Y-%m',
                    datetime(
                        v.fecha,
                        'localtime'
                    )
                ) AS mes,

                ROUND(
                    SUM(
                        (
                            iv.precio_unitario -
                            iv.costo_unitario
                        ) *
                        iv.cantidad
                    ),
                    2
                ) AS margen_bruto

            FROM ventas v

            INNER JOIN items_venta iv
                ON iv.venta_id =
                    v.id

            WHERE
                v.estado = 'ACTIVA'
                AND v.fecha >=
                    @balanceDesde
                AND v.fecha <
                    @hasta

            GROUP BY mes
        ),

        gastos_mes AS (

            SELECT
                strftime(
                    '%Y-%m',
                    datetime(
                        fecha,
                        'localtime'
                    )
                ) AS mes,

                ROUND(
                    SUM(monto),
                    2
                ) AS gastos

            FROM gastos

            WHERE
                estado = 'ACTIVO'
                AND fecha >=
                    @balanceDesde
                AND fecha <
                    @hasta

            GROUP BY mes
        ),

        compras_mes AS (

            SELECT
                strftime(
                    '%Y-%m',
                    datetime(
                        fecha,
                        'localtime'
                    )
                ) AS mes,

                ROUND(
                    SUM(total),
                    2
                ) AS compras

            FROM compras

            WHERE
                estado = 'ACTIVA'
                AND fecha >=
                    @balanceDesde
                AND fecha <
                    @hasta

            GROUP BY mes
        )

        SELECT
            strftime(
                '%Y-%m',
                meses.mes
            ) AS mes,

            ROUND(
                COALESCE(
                    vm.ventas,
                    0
                ),
                2
            ) AS ventas,

            ROUND(
                COALESCE(
                    mm.margen_bruto,
                    0
                ),
                2
            ) AS margen_bruto,

            ROUND(
                COALESCE(
                    gm.gastos,
                    0
                ),
                2
            ) AS gastos,

            ROUND(
                COALESCE(
                    cm.compras,
                    0
                ),
                2
            ) AS compras,

            ROUND(
                COALESCE(
                    mm.margen_bruto,
                    0
                ) -
                COALESCE(
                    gm.gastos,
                    0
                ),
                2
            ) AS resultado

        FROM meses

        LEFT JOIN ventas_mes vm
            ON vm.mes =
                strftime(
                    '%Y-%m',
                    meses.mes
                )

        LEFT JOIN margen_mes mm
            ON mm.mes =
                strftime(
                    '%Y-%m',
                    meses.mes
                )

        LEFT JOIN gastos_mes gm
            ON gm.mes =
                strftime(
                    '%Y-%m',
                    meses.mes
                )

        LEFT JOIN compras_mes cm
            ON cm.mes =
                strftime(
                    '%Y-%m',
                    meses.mes
                )

        ORDER BY
            meses.mes ASC
    `);


export function obtenerDashboardReportes({
    desde,
    hasta,
    balanceDesde,
    mesInicial,
    limiteProductos = 10
}) {

    const parametros = {
        desde,
        hasta
    };


    const ventas =
        ventasResumenStmt.get(
            parametros
        );


    const items =
        itemsResumenStmt.get(
            parametros
        );


    const gastos =
        gastosResumenStmt.get(
            parametros
        );


    const caja =
        cajaResumenStmt.get(
            parametros
        );


    const ventasPorHora =
        ventasHoraStmt.all(
            parametros
        );


    const productos =
        productosTopStmt.all({

            ...parametros,

            limite:
                limiteProductos

        });


    const metodos =
        metodosPagoStmt.all(
            parametros
        );


    const sinRotacion =
        sinRotacionStmt.all({

            ...parametros,

            limite:
                limiteProductos

        });


    const balanceMensual =
        balanceMensualStmt.all({

            balanceDesde,

            hasta,

            mesInicial

        });


    const horarioPico =
        ventasPorHora.reduce(
            (
                mejor,
                item
            ) => {

                if (
                    !mejor ||
                    item.unidades >
                    mejor.unidades
                ) {

                    return item;

                }


                return mejor;

            },
            null
        );


    const resultadoOperativo =
        Number(
            items.margen_bruto ||
            0
        ) -
        Number(
            gastos.gastos ||
            0
        );


    const facturacion =
        Number(
            ventas.facturacion ||
            0
        );


    const metodosConPorcentaje =
        metodos.map(
            (item) => ({

                ...item,

                porcentaje:
                    facturacion > 0
                        ? (
                            Number(
                                item.total
                            ) /
                            facturacion
                        ) * 100
                        : 0

            })
        );


    return {

        resumen: {

            total_ventas:
                ventas.total_ventas,

            facturacion:
                ventas.facturacion,

            ticket_promedio:
                ventas.ticket_promedio,

            unidades:
                items.unidades,

            costo_vendido:
                items.costo_vendido,

            margen_bruto:
                items.margen_bruto,

            gastos:
                gastos.gastos,

            resultado_operativo:
                Math.round(
                    (
                        resultadoOperativo +
                        Number.EPSILON
                    ) * 100
                ) / 100,

            movimiento_neto_caja:
                caja.movimiento_neto,

            efectivo_neto:
                caja.efectivo_neto,

            horario_pico:
                horarioPico,

            producto_estrella:
                productos[0] ||
                null

        },

        balance_mensual:
            balanceMensual,

        ventas_por_hora:
            ventasPorHora,

        productos_top:
            productos,

        metodos_pago:
            metodosConPorcentaje,

        sin_rotacion:
            sinRotacion

    };

}