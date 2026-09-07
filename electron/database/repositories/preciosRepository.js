import db
    from "../database.js";


const productoActivoStmt =
    db.prepare(`
        SELECT
            id,
            nombre,
            codigo,
            stock_actual,
            unidad

        FROM productos

        WHERE
            id = ?
            AND activo = 1
    `);


const resumenStmt =
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
            pr.precio_venta,
            pr.fecha_desde,

            CASE
                WHEN pr.id IS NULL
                    THEN NULL
                ELSE
                    ROUND(
                        pr.precio_venta -
                        pr.costo,
                        2
                    )
            END
                AS ganancia_valor,

            CASE
                WHEN
                    pr.id IS NULL
                    OR pr.costo = 0
                    THEN NULL

                ELSE
                    ROUND(
                        (
                            (
                                pr.precio_venta -
                                pr.costo
                            )
                            /
                            pr.costo
                        ) * 100,
                        2
                    )
            END
                AS ganancia_porcentaje

        FROM productos p

        LEFT JOIN precios pr
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
    `);


const vigenteStmt =
    db.prepare(`
        SELECT
            pr.id,
            pr.producto_id,
            pr.costo,
            pr.precio_venta,
            pr.fecha_desde,
            pr.fecha_hasta,

            ROUND(
                pr.precio_venta -
                pr.costo,
                2
            ) AS ganancia_valor,

            CASE
                WHEN pr.costo = 0
                    THEN NULL

                ELSE
                    ROUND(
                        (
                            (
                                pr.precio_venta -
                                pr.costo
                            )
                            /
                            pr.costo
                        ) * 100,
                        2
                    )
            END AS ganancia_porcentaje

        FROM precios pr

        WHERE
            pr.producto_id = ?
            AND pr.fecha_hasta IS NULL

        LIMIT 1
    `);


const historialStmt =
    db.prepare(`
        SELECT
            id,
            producto_id,
            costo,
            precio_venta,
            fecha_desde,
            fecha_hasta,

            ROUND(
                precio_venta -
                costo,
                2
            ) AS ganancia_valor,

            CASE
                WHEN costo = 0
                    THEN NULL

                ELSE
                    ROUND(
                        (
                            (
                                precio_venta -
                                costo
                            )
                            /
                            costo
                        ) * 100,
                        2
                    )
            END AS ganancia_porcentaje

        FROM precios

        WHERE producto_id = ?

        ORDER BY
            fecha_desde DESC,
            id DESC

        LIMIT 100
    `);


const cerrarPrecioStmt =
    db.prepare(`
        UPDATE precios

        SET fecha_hasta = ?

        WHERE
            producto_id = ?
            AND fecha_hasta IS NULL
    `);


const insertarPrecioStmt =
    db.prepare(`
        INSERT INTO precios (
            producto_id,
            costo,
            precio_venta,
            fecha_desde,
            fecha_hasta
        )

        VALUES (
            ?, ?, ?, ?, NULL
        )

        RETURNING
            id,
            producto_id,
            costo,
            precio_venta,
            fecha_desde,
            fecha_hasta
    `);


/*
 * Último costo REAL de una compra activa.
 * No usamos una compra revertida.
 */

const costoUltimaCompraStmt =
    db.prepare(`
        SELECT
            ic.costo_unitario,

            c.id
                AS compra_id,
            
            c.proveedor_id,

            c.fecha,

            pr.nombre
                AS proveedor_nombre

        FROM items_compra ic

        INNER JOIN compras c
            ON c.id = ic.compra_id

        LEFT JOIN proveedores pr
            ON pr.id = c.proveedor_id

        WHERE
            ic.producto_id = ?
            AND c.estado = 'ACTIVA'

        ORDER BY
            c.fecha DESC,
            c.id DESC,
            ic.id DESC

        LIMIT 1
    `);


function redondear(valor) {

    return Math.round(
        (
            Number(valor) +
            Number.EPSILON
        ) * 100
    ) / 100;

}


export function listarResumenPrecios({
    busqueda = "",
    limite = 50,
    offset = 0
}) {

    const texto =
        busqueda.trim();


    const parametros = {

        busqueda:
            texto,

        patron:
            `%${texto}%`,

        limite,

        offset

    };


    const items =
        resumenStmt.all(
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


export function obtenerPrecioVigente(
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


    return vigenteStmt.get(
        productoId
    ) || null;

}


export function obtenerDetallePrecio(
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


    const proveedores =
        proveedoresProductoStmt.all(
            productoId
        );


    const costoReferencia =
        costoUltimaCompraStmt.get(
            productoId
        ) || null;


    let proveedorReferencia =
        null;


    /*
     * Preferimos el proveedor
     * de la última compra.
     */

    if (
        costoReferencia
            ?.proveedor_id
    ) {

        proveedorReferencia =
            proveedores.find(
                (proveedor) =>
                    proveedor.proveedor_id ===
                    costoReferencia.proveedor_id
            ) || null;

    }


    /*
     * Si sólo tiene un proveedor,
     * no hace falta que el usuario
     * lo elija.
     */

    if (
        !proveedorReferencia &&
        proveedores.length === 1
    ) {

        proveedorReferencia =
            proveedores[0];

    }


    return {

        producto,

        vigente:
            vigenteStmt.get(
                productoId
            ) || null,

        costo_referencia:
            costoReferencia,

        proveedores,

        proveedor_referencia:
            proveedorReferencia,

        historial:
            historialStmt.all(
                productoId
            )

    };

}

const vinculoProveedorStmt =
    db.prepare(`
        SELECT
            id,
            ultimo_costo

        FROM productos_proveedores

        WHERE
            producto_id = ?
            AND proveedor_id = ?
    `);


const actualizarCostoProveedorStmt =
    db.prepare(`
        UPDATE productos_proveedores

        SET ultimo_costo = ?

        WHERE
            producto_id = ?
            AND proveedor_id = ?
    `);


const guardarPrecioTransaction =
    db.transaction(({
        productoId,
        proveedorId,
        costo,
        precioVenta
    }) => {

        const producto =
            productoActivoStmt.get(
                productoId
            );


        if (!producto) {

            throw new Error(
                "El producto no existe."
            );

        }

        let vinculoProveedor =
            null;


        if (proveedorId !== null) {

            vinculoProveedor =
                vinculoProveedorStmt.get(
                    productoId,
                    proveedorId
                );


            if (!vinculoProveedor) {

                throw new Error(
                    "El proveedor seleccionado no está vinculado al producto."
                );

            }

        }

        const costoNormalizado =
            redondear(costo);


        if (vinculoProveedor) {

            actualizarCostoProveedorStmt.run(

                costoNormalizado,

                productoId,

                proveedorId

            );

        }

        const ventaNormalizada =
            redondear(
                precioVenta
            );


        const vigente =
            vigenteStmt.get(
                productoId
            );


        /*
         * Evitamos crear historial duplicado
         * si realmente no cambió nada.
         */

        if (
            vigente &&
            vigente.costo ===
            costoNormalizado &&
            vigente.precio_venta ===
            ventaNormalizada
        ) {

            return {
                ...vigente,
                sin_cambios: true
            };

        }


        const fecha =
            new Date()
                .toISOString();


        if (vigente) {

            cerrarPrecioStmt.run(
                fecha,
                productoId
            );

        }


        const nuevo =
            insertarPrecioStmt.get(

                productoId,

                costoNormalizado,

                ventaNormalizada,

                fecha

            );


        return {
            ...nuevo,

            ganancia_valor:
                redondear(
                    ventaNormalizada -
                    costoNormalizado
                ),

            ganancia_porcentaje:
                costoNormalizado === 0
                    ? null
                    : redondear(
                        (
                            (
                                ventaNormalizada -
                                costoNormalizado
                            )
                            /
                            costoNormalizado
                        ) * 100
                    ),

            sin_cambios: false
        };

    });

const proveedoresProductoStmt =
    db.prepare(`
        SELECT
            pp.id
                AS vinculo_id,

            pp.proveedor_id,

            pr.nombre
                AS proveedor_nombre,

            pp.codigo_proveedor,

            pp.ultimo_costo

        FROM productos_proveedores pp

        INNER JOIN proveedores pr
            ON pr.id = pp.proveedor_id

        WHERE
            pp.producto_id = ?
            AND pr.activo = 1

        ORDER BY
            pr.nombre COLLATE NOCASE ASC
    `);


export function guardarPrecio(datos) {

    return guardarPrecioTransaction(
        datos
    );

}