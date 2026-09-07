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

const ventasDiaSemanaStmt =
    db.prepare(`
        WITH ventas_dia AS (

            SELECT
                CAST(
                    strftime(
                        '%w',
                        datetime(
                            fecha,
                            'localtime'
                        )
                    )
                    AS INTEGER
                ) AS dia,

                COUNT(*)
                    AS tickets,

                ROUND(
                    SUM(total),
                    2
                ) AS facturacion,

                ROUND(
                    AVG(total),
                    2
                ) AS ticket_promedio

            FROM ventas

            WHERE
                estado = 'ACTIVA'
                AND fecha >= @desde
                AND fecha < @hasta

            GROUP BY dia
        ),

        unidades_dia AS (

            SELECT
                CAST(
                    strftime(
                        '%w',
                        datetime(
                            v.fecha,
                            'localtime'
                        )
                    )
                    AS INTEGER
                ) AS dia,

                SUM(iv.cantidad)
                    AS unidades

            FROM ventas v

            INNER JOIN items_venta iv
                ON iv.venta_id =
                    v.id

            WHERE
                v.estado = 'ACTIVA'
                AND v.fecha >= @desde
                AND v.fecha < @hasta

            GROUP BY dia
        )

        SELECT
            vd.dia,
            vd.tickets,

            COALESCE(
                ud.unidades,
                0
            ) AS unidades,

            vd.facturacion,
            vd.ticket_promedio

        FROM ventas_dia vd

        LEFT JOIN unidades_dia ud
            ON ud.dia = vd.dia

        ORDER BY
            CASE vd.dia
                WHEN 1 THEN 1
                WHEN 2 THEN 2
                WHEN 3 THEN 3
                WHEN 4 THEN 4
                WHEN 5 THEN 5
                WHEN 6 THEN 6
                WHEN 0 THEN 7
            END
    `);
const categoriasTopStmt =
    db.prepare(`
        SELECT
            COALESCE(
                c.id,
                0
            ) AS categoria_id,

            COALESCE(
                c.nombre,
                'Sin categoría'
            ) AS categoria,

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
            ) AS margen_bruto,

            ROUND(
                CASE

                    WHEN
                        SUM(iv.subtotal) > 0

                    THEN
                        SUM(
                            (
                                iv.precio_unitario -
                                iv.costo_unitario
                            ) *
                            iv.cantidad
                        ) *
                        100.0 /
                        SUM(iv.subtotal)

                    ELSE 0

                END,
                2
            ) AS margen_porcentaje

        FROM items_venta iv

        INNER JOIN ventas v
            ON v.id =
                iv.venta_id

        INNER JOIN productos p
            ON p.id =
                iv.producto_id

        LEFT JOIN categorias c
            ON c.id =
                p.categoria_id

        WHERE
            v.estado = 'ACTIVA'
            AND v.fecha >= @desde
            AND v.fecha < @hasta

        GROUP BY
            p.categoria_id,
            c.nombre

        ORDER BY
            unidades DESC,
            facturacion DESC

        LIMIT @limite
    `);
const margenProductosStmt =
    db.prepare(`
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
                    iv.costo_unitario *
                    iv.cantidad
                ),
                2
            ) AS costo,

            ROUND(
                SUM(
                    (
                        iv.precio_unitario -
                        iv.costo_unitario
                    ) *
                    iv.cantidad
                ),
                2
            ) AS margen_bruto,

            ROUND(
                CASE

                    WHEN
                        SUM(iv.subtotal) > 0

                    THEN
                        SUM(
                            (
                                iv.precio_unitario -
                                iv.costo_unitario
                            ) *
                            iv.cantidad
                        ) *
                        100.0 /
                        SUM(iv.subtotal)

                    ELSE 0

                END,
                2
            ) AS margen_porcentaje

        FROM items_venta iv

        INNER JOIN ventas v
            ON v.id =
                iv.venta_id

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

        ORDER BY
            margen_bruto DESC,
            facturacion DESC

        LIMIT @limite
    `);
const comparativaPeriodosStmt =
    db.prepare(`
        WITH periodos AS (

            SELECT
                'actual' AS periodo

            UNION ALL

            SELECT
                'anterior'
        ),

        ventas_periodo AS (

            SELECT
                CASE

                    WHEN
                        fecha >= @desde
                        AND fecha < @hasta

                    THEN 'actual'

                    ELSE 'anterior'

                END AS periodo,

                COUNT(*)
                    AS ventas,

                ROUND(
                    SUM(total),
                    2
                ) AS facturacion,

                ROUND(
                    AVG(total),
                    2
                ) AS ticket_promedio

            FROM ventas

            WHERE
                estado = 'ACTIVA'

                AND (
                    (
                        fecha >= @desde
                        AND fecha < @hasta
                    )

                    OR

                    (
                        fecha >= @anteriorDesde
                        AND fecha < @anteriorHasta
                    )
                )

            GROUP BY periodo
        ),

        items_periodo AS (

            SELECT
                CASE

                    WHEN
                        v.fecha >= @desde
                        AND v.fecha < @hasta

                    THEN 'actual'

                    ELSE 'anterior'

                END AS periodo,

                SUM(iv.cantidad)
                    AS unidades,

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

                AND (
                    (
                        v.fecha >= @desde
                        AND v.fecha < @hasta
                    )

                    OR

                    (
                        v.fecha >= @anteriorDesde
                        AND v.fecha < @anteriorHasta
                    )
                )

            GROUP BY periodo
        ),

        gastos_periodo AS (

            SELECT
                CASE

                    WHEN
                        fecha >= @desde
                        AND fecha < @hasta

                    THEN 'actual'

                    ELSE 'anterior'

                END AS periodo,

                ROUND(
                    SUM(monto),
                    2
                ) AS gastos

            FROM gastos

            WHERE
                estado = 'ACTIVO'

                AND (
                    (
                        fecha >= @desde
                        AND fecha < @hasta
                    )

                    OR

                    (
                        fecha >= @anteriorDesde
                        AND fecha < @anteriorHasta
                    )
                )

            GROUP BY periodo
        )

        SELECT
            p.periodo,

            COALESCE(
                vp.ventas,
                0
            ) AS ventas,

            COALESCE(
                vp.facturacion,
                0
            ) AS facturacion,

            COALESCE(
                vp.ticket_promedio,
                0
            ) AS ticket_promedio,

            COALESCE(
                ip.unidades,
                0
            ) AS unidades,

            COALESCE(
                ip.margen_bruto,
                0
            ) AS margen_bruto,

            COALESCE(
                gp.gastos,
                0
            ) AS gastos,

            ROUND(
                COALESCE(
                    ip.margen_bruto,
                    0
                ) -
                COALESCE(
                    gp.gastos,
                    0
                ),
                2
            ) AS resultado

        FROM periodos p

        LEFT JOIN ventas_periodo vp
            ON vp.periodo =
                p.periodo

        LEFT JOIN items_periodo ip
            ON ip.periodo =
                p.periodo

        LEFT JOIN gastos_periodo gp
            ON gp.periodo =
                p.periodo
    `);
const rentabilidadCayendoStmt =
    db.prepare(`
        WITH producto_periodo AS (

            SELECT
                iv.producto_id,

                p.nombre,

                CASE

                    WHEN
                        v.fecha >= @desde
                        AND v.fecha < @hasta

                    THEN 'actual'

                    ELSE 'anterior'

                END AS periodo,

                SUM(iv.cantidad)
                    AS unidades,

                SUM(iv.subtotal)
                    AS facturacion,

                SUM(
                    (
                        iv.precio_unitario -
                        iv.costo_unitario
                    ) *
                    iv.cantidad
                ) AS margen

            FROM items_venta iv

            INNER JOIN ventas v
                ON v.id =
                    iv.venta_id

            INNER JOIN productos p
                ON p.id =
                    iv.producto_id

            WHERE
                v.estado = 'ACTIVA'

                AND (
                    (
                        v.fecha >= @desde
                        AND v.fecha < @hasta
                    )

                    OR

                    (
                        v.fecha >= @anteriorDesde
                        AND v.fecha < @anteriorHasta
                    )
                )

            GROUP BY
                iv.producto_id,
                p.nombre,
                periodo
        ),

        comparado AS (

            SELECT
                producto_id,
                nombre,

                SUM(
                    CASE
                        WHEN periodo =
                            'actual'
                        THEN unidades
                        ELSE 0
                    END
                ) AS unidades_actual,

                SUM(
                    CASE
                        WHEN periodo =
                            'anterior'
                        THEN unidades
                        ELSE 0
                    END
                ) AS unidades_anterior,

                SUM(
                    CASE
                        WHEN periodo =
                            'actual'
                        THEN facturacion
                        ELSE 0
                    END
                ) AS facturacion_actual,

                SUM(
                    CASE
                        WHEN periodo =
                            'anterior'
                        THEN facturacion
                        ELSE 0
                    END
                ) AS facturacion_anterior,

                SUM(
                    CASE
                        WHEN periodo =
                            'actual'
                        THEN margen
                        ELSE 0
                    END
                ) AS margen_actual,

                SUM(
                    CASE
                        WHEN periodo =
                            'anterior'
                        THEN margen
                        ELSE 0
                    END
                ) AS margen_anterior

            FROM producto_periodo

            GROUP BY
                producto_id,
                nombre
        ),

        margenes AS (

            SELECT
                *,

                ROUND(
                    CASE
                        WHEN facturacion_actual > 0
                        THEN
                            margen_actual *
                            100.0 /
                            facturacion_actual
                        ELSE 0
                    END,
                    2
                ) AS margen_pct_actual,

                ROUND(
                    CASE
                        WHEN facturacion_anterior > 0
                        THEN
                            margen_anterior *
                            100.0 /
                            facturacion_anterior
                        ELSE 0
                    END,
                    2
                ) AS margen_pct_anterior

            FROM comparado

            WHERE
                unidades_actual > 0
                AND unidades_anterior > 0
                AND facturacion_actual > 0
                AND facturacion_anterior > 0
        )

        SELECT
            producto_id,
            nombre,

            unidades_actual,
            unidades_anterior,

            ROUND(
                facturacion_actual,
                2
            ) AS facturacion_actual,

            ROUND(
                facturacion_anterior,
                2
            ) AS facturacion_anterior,

            margen_pct_actual,
            margen_pct_anterior,

            ROUND(
                margen_pct_actual -
                margen_pct_anterior,
                2
            ) AS variacion_puntos

        FROM margenes

        WHERE
            margen_pct_actual <
            margen_pct_anterior -
            0.5

        ORDER BY
            variacion_puntos ASC,
            facturacion_actual DESC

        LIMIT @limite
    `);
function redondear(
    valor
) {

    return Math.round(
        (
            Number(valor) +
            Number.EPSILON
        ) * 100
    ) / 100;

}


function variacionPorcentual(
    actual,
    anterior
) {

    const actualNumero =
        Number(actual || 0);


    const anteriorNumero =
        Number(anterior || 0);


    if (anteriorNumero === 0) {

        return actualNumero === 0
            ? 0
            : null;

    }


    return redondear(
        (
            actualNumero -
            anteriorNumero
        ) /
        Math.abs(
            anteriorNumero
        ) *
        100
    );

}

export function obtenerDashboardReportes({
    desde,
    hasta,

    anteriorDesde,
    anteriorHasta,

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

    const ventasPorDia =
        ventasDiaSemanaStmt.all(
            parametros
        );


    const categorias =
        categoriasTopStmt.all({

            ...parametros,

            limite:
                limiteProductos

        });


    const margenProductos =
        margenProductosStmt.all({

            ...parametros,

            limite:
                limiteProductos

        });


    const parametrosComparacion = {

        desde,
        hasta,

        anteriorDesde,
        anteriorHasta

    };


    const comparacionRaw =
        comparativaPeriodosStmt.all(
            parametrosComparacion
        );


    const rentabilidadCayendo =
        rentabilidadCayendoStmt.all({

            ...parametrosComparacion,

            limite:
                limiteProductos

        });
    const actual =
        comparacionRaw.find(
            (item) =>
                item.periodo ===
                "actual"
        ) || {};


    const anterior =
        comparacionRaw.find(
            (item) =>
                item.periodo ===
                "anterior"
        ) || {};


    const comparativa = {

        actual,

        anterior,

        variacion: {

            facturacion:
                variacionPorcentual(
                    actual.facturacion,
                    anterior.facturacion
                ),

            ventas:
                variacionPorcentual(
                    actual.ventas,
                    anterior.ventas
                ),

            unidades:
                variacionPorcentual(
                    actual.unidades,
                    anterior.unidades
                ),

            ticket_promedio:
                variacionPorcentual(
                    actual.ticket_promedio,
                    anterior.ticket_promedio
                ),

            margen_bruto:
                variacionPorcentual(
                    actual.margen_bruto,
                    anterior.margen_bruto
                ),

            gastos:
                variacionPorcentual(
                    actual.gastos,
                    anterior.gastos
                ),

            resultado:
                variacionPorcentual(
                    actual.resultado,
                    anterior.resultado
                )

        }

    };

    const diaFuerte =
        ventasPorDia.reduce(
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

    const margenPorcentaje =
        facturacion > 0
            ? redondear(
                Number(
                    items.margen_bruto
                ) *
                100 /
                facturacion
            )
            : 0;
    return {

        resumen: {
            margen_porcentaje:
                margenPorcentaje,

            dia_fuerte:
                diaFuerte,

            categoria_lider:
                categorias[0] ||
                null,

            variacion_facturacion:
                comparativa
                    .variacion
                    .facturacion,

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
            sinRotacion,

        ventas_por_dia:
            ventasPorDia,

        categorias_top:
            categorias,

        margen_productos:
            margenProductos,

        comparativa:
            comparativa,

        rentabilidad_cayendo:
            rentabilidadCayendo

    };

}