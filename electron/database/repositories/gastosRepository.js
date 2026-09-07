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


/*
 * CATEGORÍAS
 */

const categoriasStmt =
    db.prepare(`
        SELECT
            id,
            nombre

        FROM categorias_gasto

        WHERE activo = 1

        ORDER BY
            nombre COLLATE NOCASE ASC
    `);


const categoriaStmt =
    db.prepare(`
        SELECT
            id,
            nombre

        FROM categorias_gasto

        WHERE
            id = ?
            AND activo = 1
    `);


const crearCategoriaStmt =
    db.prepare(`
        INSERT INTO categorias_gasto (
            nombre
        )

        VALUES (?)

        RETURNING
            id,
            nombre
    `);


const actualizarCategoriaStmt =
    db.prepare(`
        UPDATE categorias_gasto

        SET nombre = ?

        WHERE
            id = ?
            AND activo = 1

        RETURNING
            id,
            nombre
    `);


const eliminarCategoriaStmt =
    db.prepare(`
        UPDATE categorias_gasto

        SET activo = 0

        WHERE
            id = ?
            AND activo = 1
    `);


/*
 * GASTOS
 */

const crearGastoStmt =
    db.prepare(`
        INSERT INTO gastos (
            categoria_id,
            categoria,

            descripcion,
            monto,
            fecha,

            metodo_pago,
            notas,

            estado,
            caja_id
        )

        VALUES (
            ?, ?,
            ?, ?, ?,
            ?, ?,
            'ACTIVO',
            ?
        )

        RETURNING id
    `);


const gastoStmt =
    db.prepare(`
        SELECT
            g.id,

            g.categoria_id,
            g.categoria,

            g.descripcion,
            g.monto,
            g.fecha,

            g.metodo_pago,
            g.notas,

            g.estado,

            g.fecha_reversion,
            g.motivo_reversion,

            g.caja_id,
            g.caja_reversion_id

        FROM gastos g

        WHERE g.id = ?
    `);


const movimientosGastoStmt =
    db.prepare(`
        SELECT
            id,
            tipo,
            concepto,
            monto,
            fecha,
            caja_id,
            metodo_pago,
            movimiento_origen_id,
            notas

        FROM movimientos_caja

        WHERE gasto_id = ?

        ORDER BY
            fecha ASC,
            id ASC
    `);


const movimientoOriginalStmt =
    db.prepare(`
        SELECT
            id,
            caja_id,
            monto,
            metodo_pago

        FROM movimientos_caja

        WHERE
            gasto_id = ?
            AND tipo = 'GASTO'

        ORDER BY id ASC

        LIMIT 1
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
            NULL, ?,
            ?,
            ?
        )

        RETURNING id
    `);


const marcarRevertidoStmt =
    db.prepare(`
        UPDATE gastos

        SET
            estado = 'REVERTIDO',
            fecha_reversion = ?,
            motivo_reversion = ?,
            caja_reversion_id = ?

        WHERE
            id = ?
            AND estado = 'ACTIVO'
    `);


const listarStmt =
    db.prepare(`
        SELECT
            g.id,

            g.categoria_id,
            g.categoria,

            g.descripcion,
            g.monto,
            g.fecha,

            g.metodo_pago,
            g.estado,

            g.caja_id,

            g.fecha_reversion

        FROM gastos g

        WHERE
            (
                @categoriaId IS NULL
                OR
                g.categoria_id =
                    @categoriaId
            )

            AND (
                @metodoPago IS NULL
                OR
                g.metodo_pago =
                    @metodoPago
            )

            AND (
                @estado IS NULL
                OR
                g.estado =
                    @estado
            )

            AND (
                @busqueda = ''

                OR

                g.categoria
                    COLLATE NOCASE
                    LIKE @patron

                OR

                COALESCE(
                    g.descripcion,
                    ''
                )
                    COLLATE NOCASE
                    LIKE @patron

                OR

                COALESCE(
                    g.notas,
                    ''
                )
                    COLLATE NOCASE
                    LIKE @patron
            )

        ORDER BY
            g.fecha DESC,
            g.id DESC

        LIMIT @limite
        OFFSET @offset
    `);


const contarStmt =
    db.prepare(`
        SELECT
            COUNT(*) AS total

        FROM gastos g

        WHERE
            (
                @categoriaId IS NULL
                OR
                g.categoria_id =
                    @categoriaId
            )

            AND (
                @metodoPago IS NULL
                OR
                g.metodo_pago =
                    @metodoPago
            )

            AND (
                @estado IS NULL
                OR
                g.estado =
                    @estado
            )

            AND (
                @busqueda = ''

                OR

                g.categoria
                    COLLATE NOCASE
                    LIKE @patron

                OR

                COALESCE(
                    g.descripcion,
                    ''
                )
                    COLLATE NOCASE
                    LIKE @patron

                OR

                COALESCE(
                    g.notas,
                    ''
                )
                    COLLATE NOCASE
                    LIKE @patron
            )
    `);


const resumenStmt =
    db.prepare(`
        SELECT

            COUNT(*) AS cantidad,

            ROUND(
                COALESCE(
                    SUM(
                        CASE
                            WHEN estado = 'ACTIVO'
                            THEN monto
                            ELSE 0
                        END
                    ),
                    0
                ),
                2
            ) AS monto_activo,

            ROUND(
                COALESCE(
                    SUM(
                        CASE
                            WHEN estado = 'REVERTIDO'
                            THEN monto
                            ELSE 0
                        END
                    ),
                    0
                ),
                2
            ) AS monto_revertido

        FROM gastos g

        WHERE
            (
                @categoriaId IS NULL
                OR
                g.categoria_id =
                    @categoriaId
            )

            AND (
                @metodoPago IS NULL
                OR
                g.metodo_pago =
                    @metodoPago
            )

            AND (
                @estado IS NULL
                OR
                g.estado =
                    @estado
            )

            AND (
                @busqueda = ''

                OR

                g.categoria
                    COLLATE NOCASE
                    LIKE @patron

                OR

                COALESCE(
                    g.descripcion,
                    ''
                )
                    COLLATE NOCASE
                    LIKE @patron

                OR

                COALESCE(
                    g.notas,
                    ''
                )
                    COLLATE NOCASE
                    LIKE @patron
            )
    `);


function redondear(valor) {

    return Math.round(
        (
            Number(valor) +
            Number.EPSILON
        ) * 100
    ) / 100;

}


function esDuplicado(error) {

    return (
        error?.code ===
        "SQLITE_CONSTRAINT_UNIQUE"
    );

}


/*
 * CATEGORÍAS
 */

export function listarCategoriasGasto() {

    return categoriasStmt.all();

}


export function crearCategoriaGasto(
    nombre
) {

    try {

        return crearCategoriaStmt.get(
            nombre
        );


    } catch (error) {

        if (esDuplicado(error)) {

            throw new Error(
                "Ya existe una categoría con ese nombre."
            );

        }


        throw error;

    }

}


export function actualizarCategoriaGasto({
    id,
    nombre
}) {

    try {

        const resultado =
            actualizarCategoriaStmt.get(
                nombre,
                id
            );


        if (!resultado) {

            throw new Error(
                "La categoría no existe."
            );

        }


        return resultado;


    } catch (error) {

        if (esDuplicado(error)) {

            throw new Error(
                "Ya existe otra categoría con ese nombre."
            );

        }


        throw error;

    }

}


export function eliminarCategoriaGasto(id) {

    const resultado =
        eliminarCategoriaStmt.run(id);


    if (
        resultado.changes !== 1
    ) {

        throw new Error(
            "La categoría no existe o ya fue desactivada."
        );

    }


    return {
        success: true,
        id
    };

}


/*
 * CREAR GASTO
 */

const registrarGastoTransaction =
    db.transaction(({
        categoriaId,
        descripcion,
        monto,
        fecha,
        metodoPago,
        notas
    }) => {

        const caja =
            cajaAbiertaStmt.get();


        if (!caja) {

            throw new Error(
                "Debe abrir la caja antes de registrar un gasto."
            );

        }


        if (
            new Date(fecha) <
            new Date(
                caja.fecha_apertura
            )
        ) {

            throw new Error(
                "La fecha del gasto no puede ser anterior a la apertura de caja."
            );

        }


        const categoria =
            categoriaStmt.get(
                categoriaId
            );


        if (!categoria) {

            throw new Error(
                "La categoría no existe o está desactivada."
            );

        }


        const importe =
            redondear(monto);


        const gasto =
            crearGastoStmt.get(

                categoria.id,

                categoria.nombre,

                descripcion,

                importe,

                fecha,

                metodoPago,

                notas,

                caja.id

            );


        const concepto =
            descripcion
                ? `${categoria.nombre} · ${descripcion}`
                : categoria.nombre;


        movimientoCajaStmt.run(

            "GASTO",

            `Gasto #${gasto.id} · ${concepto}`,

            -importe,

            fecha,

            caja.id,

            metodoPago,

            gasto.id,

            null,

            notas

        );


        return obtenerGasto(
            gasto.id
        );

    });


export function registrarGasto(datos) {

    return registrarGastoTransaction(
        datos
    );

}


/*
 * LISTAR
 */

export function listarGastos({
    categoriaId = null,
    metodoPago = null,
    estado = null,
    busqueda = "",
    limite = 25,
    offset = 0
}) {

    const texto =
        busqueda.trim();


    const parametros = {

        categoriaId,
        metodoPago,
        estado,

        busqueda:
            texto,

        patron:
            `%${texto}%`,

        limite,
        offset

    };


    return {

        items:
            listarStmt.all(
                parametros
            ),

        total:
            contarStmt
                .get(parametros)
                .total,

        resumen:
            resumenStmt.get(
                parametros
            )

    };

}


export function obtenerGasto(id) {

    const gasto =
        gastoStmt.get(id);


    if (!gasto) {

        throw new Error(
            "El gasto no existe."
        );

    }


    return {

        ...gasto,

        movimientos:
            movimientosGastoStmt.all(
                id
            )

    };

}


/*
 * REVERSIÓN
 */

const revertirGastoTransaction =
    db.transaction(({
        gastoId,
        motivo
    }) => {

        const caja =
            cajaAbiertaStmt.get();


        if (!caja) {

            throw new Error(
                "Debe haber una caja abierta para revertir un gasto."
            );

        }


        const gasto =
            gastoStmt.get(
                gastoId
            );


        if (!gasto) {

            throw new Error(
                "El gasto no existe."
            );

        }


        if (
            gasto.estado ===
            "REVERTIDO"
        ) {

            throw new Error(
                "El gasto ya fue revertido."
            );

        }


        const original =
            movimientoOriginalStmt.get(
                gasto.id
            );


        if (!original) {

            throw new Error(
                "El gasto no tiene un movimiento de caja asociado."
            );

        }


        const fecha =
            new Date()
                .toISOString();


        movimientoCajaStmt.run(

            "REVERSA_GASTO",

            `Reversión gasto #${gasto.id}`,

            gasto.monto,

            fecha,

            caja.id,

            gasto.metodo_pago,

            gasto.id,

            original.id,

            motivo

        );


        const resultado =
            marcarRevertidoStmt.run(

                fecha,

                motivo,

                caja.id,

                gasto.id

            );


        if (
            resultado.changes !== 1
        ) {

            throw new Error(
                "No se pudo revertir el gasto."
            );

        }


        return obtenerGasto(
            gasto.id
        );

    });


export function revertirGasto(datos) {

    return revertirGastoTransaction(
        datos
    );

}