import db
    from "../database.js";


const cajaAbiertaStmt =
    db.prepare(`
        SELECT
            *

        FROM cajas

        WHERE estado = 'ABIERTA'

        LIMIT 1
    `);


const cajaStmt =
    db.prepare(`
        SELECT
            *

        FROM cajas

        WHERE id = ?
    `);


const abrirCajaStmt =
    db.prepare(`
        INSERT INTO cajas (
            fecha_apertura,
            saldo_inicial,
            notas_apertura,
            estado
        )

        VALUES (
            ?, ?, ?, 'ABIERTA'
        )

        RETURNING *
    `);


const cerrarCajaStmt =
    db.prepare(`
        UPDATE cajas

        SET
            fecha_cierre = ?,
            efectivo_esperado = ?,
            efectivo_real = ?,
            diferencia = ?,
            notas_cierre = ?,
            estado = 'CERRADA'

        WHERE
            id = ?
            AND estado = 'ABIERTA'

        RETURNING *
    `);


const resumenStmt =
    db.prepare(`
        SELECT

            COUNT(*)
                AS total_movimientos,

            ROUND(
                COALESCE(
                    SUM(monto),
                    0
                ),
                2
            )
                AS movimiento_neto,

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
            )
                AS efectivo_movimientos,

            ROUND(
                COALESCE(
                    SUM(
                        CASE
                            WHEN tipo IN (
                                'VENTA',
                                'REVERSA_VENTA'
                            )
                            THEN monto
                            ELSE 0
                        END
                    ),
                    0
                ),
                2
            )
                AS ventas_netas,

            ROUND(
                COALESCE(
                    SUM(
                        CASE
                            WHEN tipo =
                                'INGRESO_MANUAL'
                            THEN monto
                            ELSE 0
                        END
                    ),
                    0
                ),
                2
            )
                AS ingresos_manuales,

            ROUND(
                ABS(
                    COALESCE(
                        SUM(
                            CASE
                                WHEN tipo =
                                    'EGRESO_MANUAL'
                                THEN monto
                                ELSE 0
                            END
                        ),
                        0
                    )
                ),
                2
            )
                AS egresos_manuales

        FROM movimientos_caja

        WHERE caja_id = ?
    `);


const resumenMetodoStmt =
    db.prepare(`
        SELECT
            COALESCE(
                metodo_pago,
                'SIN_METODO'
            ) AS metodo_pago,

            ROUND(
                SUM(monto),
                2
            ) AS total

        FROM movimientos_caja

        WHERE caja_id = ?

        GROUP BY
            metodo_pago

        ORDER BY
            metodo_pago ASC
    `);


const insertarMovimientoStmt =
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
            NULL, NULL,
            ?,
            ?
        )

        RETURNING *
    `);


const movimientoStmt =
    db.prepare(`
        SELECT
            m.*,

            CASE
        WHEN m.tipo = 'VENTA'
        THEN v.efectivo_recibido
        ELSE NULL
        END AS efectivo_recibido,

            CASE
        WHEN m.tipo = 'VENTA'
        THEN v.vuelto
        ELSE NULL
        END AS vuelto,

            EXISTS(
                SELECT 1

                FROM movimientos_caja r

                WHERE
                    r.movimiento_origen_id =
                        m.id
            ) AS revertido

        FROM movimientos_caja m
        LEFT JOIN ventas v
        ON v.id =
        m.venta_id
        WHERE m.id = ?
    `);


const movimientosStmt =
    db.prepare(`
        SELECT
            m.*,

            v.efectivo_recibido
                AS efectivo_recibido,

            v.vuelto
                AS vuelto


        FROM movimientos_caja m


        LEFT JOIN ventas v
            ON v.id =
                m.venta_id


        WHERE
            m.caja_id = @cajaId

            AND (
                @metodoPago IS NULL
                OR
                m.metodo_pago =
                    @metodoPago
            )


        ORDER BY
            m.fecha DESC,
            m.id DESC


        LIMIT @limite
        OFFSET @offset
    `);


const contarMovimientosStmt =
    db.prepare(`
        SELECT
            COUNT(*) AS total

        FROM movimientos_caja

        WHERE
            caja_id = @cajaId

            AND (
                @metodoPago IS NULL
                OR
                metodo_pago =
                    @metodoPago
            )
    `);


const historialCajasStmt =
    db.prepare(`
        SELECT
            id,
            fecha_apertura,
            fecha_cierre,
            saldo_inicial,
            efectivo_esperado,
            efectivo_real,
            diferencia,
            estado,
            notas_apertura,
            notas_cierre

        FROM cajas

        ORDER BY
            fecha_apertura DESC,
            id DESC

        LIMIT ?
        OFFSET ?
    `);


const contarCajasStmt =
    db.prepare(`
        SELECT
            COUNT(*) AS total

        FROM cajas
    `);


function redondear(valor) {

    return Math.round(
        (
            Number(valor) +
            Number.EPSILON
        ) * 100
    ) / 100;

}


function obtenerCajaCompleta(id) {

    const caja =
        cajaStmt.get(id);


    if (!caja) {

        throw new Error(
            "La caja no existe."
        );

    }


    const resumen =
        resumenStmt.get(id);


    const efectivoEsperadoActual =
        redondear(
            caja.saldo_inicial +
            resumen.efectivo_movimientos
        );


    return {

        ...caja,

        resumen: {
            ...resumen,

            efectivo_esperado_actual:
                efectivoEsperadoActual
        },

        por_metodo:
            resumenMetodoStmt.all(id)

    };

}


const abrirCajaTransaction =
    db.transaction(({
        saldoInicial,
        notas
    }) => {

        const abierta =
            cajaAbiertaStmt.get();


        if (abierta) {

            throw new Error(
                "Ya existe una caja abierta."
            );

        }


        const caja =
            abrirCajaStmt.get(

                new Date()
                    .toISOString(),

                redondear(
                    saldoInicial
                ),

                notas

            );


        return obtenerCajaCompleta(
            caja.id
        );

    });


export function abrirCaja(datos) {

    return abrirCajaTransaction(
        datos
    );

}


export function obtenerCajaActual() {

    const caja =
        cajaAbiertaStmt.get();


    if (!caja) {
        return null;
    }


    return obtenerCajaCompleta(
        caja.id
    );

}


const movimientoManualTransaction =
    db.transaction(({
        tipo,
        concepto,
        monto,
        metodoPago,
        notas
    }) => {

        const caja =
            cajaAbiertaStmt.get();


        if (!caja) {

            throw new Error(
                "Debe abrir la caja primero."
            );

        }


        const importe =
            redondear(
                Math.abs(monto)
            );


        const montoFirmado =
            tipo === "INGRESO_MANUAL"
                ? importe
                : -importe;


        return insertarMovimientoStmt.get(

            tipo,

            concepto,

            montoFirmado,

            new Date()
                .toISOString(),

            caja.id,

            metodoPago,

            null,

            notas

        );

    });


export function registrarMovimientoManual(
    datos
) {

    return movimientoManualTransaction(
        datos
    );

}


const revertirManualTransaction =
    db.transaction(({
        movimientoId,
        motivo
    }) => {

        const caja =
            cajaAbiertaStmt.get();


        if (!caja) {

            throw new Error(
                "No hay una caja abierta."
            );

        }


        const movimiento =
            movimientoStmt.get(
                movimientoId
            );


        if (!movimiento) {

            throw new Error(
                "El movimiento no existe."
            );

        }


        if (
            ![
                "INGRESO_MANUAL",
                "EGRESO_MANUAL"
            ].includes(
                movimiento.tipo
            )
        ) {

            throw new Error(
                "Este movimiento debe revertirse desde su módulo de origen."
            );

        }


        if (
            movimiento.caja_id !==
            caja.id
        ) {

            throw new Error(
                "Sólo se pueden revertir movimientos manuales de la caja actualmente abierta."
            );

        }


        if (movimiento.revertido) {

            throw new Error(
                "El movimiento ya fue revertido."
            );

        }


        return insertarMovimientoStmt.get(

            "REVERSA_MANUAL",

            `Reversión: ${movimiento.concepto}`,

            -movimiento.monto,

            new Date()
                .toISOString(),

            caja.id,

            movimiento.metodo_pago,

            movimiento.id,

            motivo

        );

    });


export function revertirMovimientoManual(
    datos
) {

    return revertirManualTransaction(
        datos
    );

}


const cerrarCajaTransaction =
    db.transaction(({
        efectivoReal,
        notas
    }) => {

        const caja =
            cajaAbiertaStmt.get();


        if (!caja) {

            throw new Error(
                "No hay una caja abierta."
            );

        }


        const resumen =
            resumenStmt.get(
                caja.id
            );


        const esperado =
            redondear(
                caja.saldo_inicial +
                resumen.efectivo_movimientos
            );


        const real =
            redondear(
                efectivoReal
            );


        const diferencia =
            redondear(
                real -
                esperado
            );


        const cerrada =
            cerrarCajaStmt.get(

                new Date()
                    .toISOString(),

                esperado,

                real,

                diferencia,

                notas,

                caja.id

            );


        if (!cerrada) {

            throw new Error(
                "No se pudo cerrar la caja."
            );

        }


        return obtenerCajaCompleta(
            caja.id
        );

    });


export function cerrarCaja(datos) {

    return cerrarCajaTransaction(
        datos
    );

}


export function listarMovimientosCaja({
    cajaId,
    metodoPago = null,
    limite = 50,
    offset = 0
}) {

    const parametros = {

        cajaId,
        metodoPago,
        limite,
        offset

    };


    const items =
        movimientosStmt.all(
            parametros
        );


    const {
        total
    } =
        contarMovimientosStmt.get(
            parametros
        );


    return {
        items,
        total
    };

}


export function listarCajas({
    limite = 25,
    offset = 0
}) {

    return {

        items:
            historialCajasStmt.all(
                limite,
                offset
            ),

        total:
            contarCajasStmt
                .get()
                .total

    };

}


export function obtenerCaja(id) {

    return obtenerCajaCompleta(
        id
    );

}