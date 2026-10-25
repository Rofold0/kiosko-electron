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
            ON pr.id = (

                SELECT
                    ph.id

                FROM precios ph

                WHERE
                    ph.producto_id =
                        p.id

                    AND ph.fecha_desde <=
                        @fecha

                    AND (
                        ph.fecha_hasta IS NULL
                        OR ph.fecha_hasta >
                            @fecha
                    )

                ORDER BY
                    ph.fecha_desde DESC,
                    ph.id DESC

                LIMIT 1

            )

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

            COALESCE(
    h.categoria_id,
    p.categoria_id
) AS categoria_id,

COALESCE(
    h.categoria_nombre,
    c.nombre,
    'Sin categoría'
) AS categoria_nombre,

        FROM productos p

        INNER JOIN precios pr
            ON pr.id = (

                SELECT
                    ph.id

                FROM precios ph

                WHERE
                    ph.producto_id =
                        p.id

                    AND ph.fecha_desde <=
                        @fecha

                    AND (
                        ph.fecha_hasta IS NULL
                        OR ph.fecha_hasta >
                            @fecha
                    )

                ORDER BY
                    ph.fecha_desde DESC,
                    ph.id DESC

                LIMIT 1

            )

        WHERE
            p.id =
                @productoId

            AND p.activo = 1
            LEFT JOIN productos_categoria_historial h
    ON h.id = (

        SELECT
            hh.id

        FROM productos_categoria_historial hh

        WHERE
            hh.producto_id =
                p.id

            AND hh.fecha_desde <=
                @fecha

            AND (
                hh.fecha_hasta IS NULL
                OR hh.fecha_hasta >
                    @fecha
            )

        ORDER BY
            hh.fecha_desde DESC,
            hh.id DESC

        LIMIT 1
    )

LEFT JOIN categorias c
    ON c.id =
        p.categoria_id
    `);

const ofertasProductoStmt =
    db.prepare(`
        SELECT
            o.id,
            o.nombre,
            o.tipo,
            o.valor

        FROM ofertas o

        INNER JOIN ofertas_productos op
            ON op.oferta_id =
                o.id

        WHERE
            op.producto_id =
                @productoId

            AND o.activo = 1

            AND o.fecha_desde <=
                @fecha

            AND o.fecha_hasta >
                @fecha

        ORDER BY
            o.id DESC
    `);

const combosVigentesStmt =
    db.prepare(`
        SELECT
            c.id
                AS combo_id,

            c.nombre
                AS combo_nombre,

            c.precio_combo,

            c.modo_precio,
            c.valor_regla,
            c.alcance_descuento,

            cp.producto_id,
            cp.cantidad

        FROM ofertas_combo c

        INNER JOIN ofertas_combo_productos cp
            ON cp.combo_id =
                c.id

        WHERE
            c.activo = 1

            AND c.fecha_desde <=
                @fecha

            AND c.fecha_hasta >
                @fecha

        ORDER BY
            c.id ASC,
            cp.producto_id ASC
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
            oferta_id,
            oferta_nombre,
            cantidad,
            categoria_id,
            categoria_nombre,
            costo_unitario,
            precio_lista,
            descuento_unitario,
            precio_unitario,
            subtotal
        )

        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);

const crearComboVentaStmt =
    db.prepare(`
        INSERT INTO combos_venta (
            venta_id,
            combo_id,
            combo_nombre,
            cantidad,
            precio_unitario,
            subtotal
        )

        VALUES (?, ?, ?, ?, ?, ?)

        RETURNING id
    `);


const crearComboVentaProductoStmt =
    db.prepare(`
        INSERT INTO combos_venta_productos (
            combo_venta_id,
            producto_id,
            producto_nombre,
            categoria_id,
            categoria_nombre,
            cantidad,
            costo_unitario
        )

        VALUES (?, ?, ?, ?, ?)
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
            iv.oferta_id,
            iv.oferta_nombre,
            iv.precio_lista,
            iv.descuento_unitario,
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

const combosVentaStmt =
    db.prepare(`
        SELECT
            id,
            combo_id,
            combo_nombre,
            cantidad,
            precio_unitario,
            subtotal

        FROM combos_venta

        WHERE venta_id = ?

        ORDER BY id ASC
    `);


const comboVentaProductosStmt =
    db.prepare(`
        SELECT
            producto_id,
            producto_nombre,
            cantidad,
            costo_unitario

        FROM combos_venta_productos

        WHERE combo_venta_id = ?

        ORDER BY id ASC
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
        WITH unidades AS (

            SELECT
                iv.producto_id,
                iv.cantidad

            FROM items_venta iv

            WHERE
                iv.venta_id = ?


            UNION ALL


            SELECT
                cvp.producto_id,
                cvp.cantidad

            FROM combos_venta cv

            INNER JOIN combos_venta_productos cvp
                ON cvp.combo_venta_id =
                    cv.id

            WHERE
                cv.venta_id = ?
        )

        SELECT
            u.producto_id,

            SUM(
                u.cantidad
            ) AS cantidad,

            p.nombre
                AS producto_nombre,

            p.stock_actual

        FROM unidades u

        INNER JOIN productos p
            ON p.id =
                u.producto_id

        GROUP BY
            u.producto_id

        ORDER BY
            u.producto_id
    `);


function redondear(valor) {

    return Math.round(
        (
            Number(valor) +
            Number.EPSILON
        ) * 100
    ) / 100;

}

function resolverPrecioOferta(
    producto,
    fecha
) {

    const precioLista =
        redondear(
            producto.precio_venta
        );


    const ofertas =
        ofertasProductoStmt.all({

            productoId:
                producto.id ??
                producto.producto_id,

            fecha

        });


    let mejor = {

        oferta_id:
            null,

        oferta_nombre:
            null,

        precio_lista:
            precioLista,

        descuento_unitario:
            0,

        precio_unitario:
            precioLista

    };


    for (
        const oferta
        of ofertas
    ) {

        let precioOferta;


        if (
            oferta.tipo ===
            "PORCENTAJE"
        ) {

            precioOferta =
                redondear(

                    precioLista *
                    (
                        1 -
                        oferta.valor /
                        100
                    )

                );


        } else {

            precioOferta =
                redondear(
                    Math.min(
                        precioLista,
                        oferta.valor
                    )
                );

        }


        precioOferta =
            Math.max(
                0,
                precioOferta
            );


        /*
         * Sólo consideramos una oferta
         * si realmente mejora el precio.
         */

        if (
            precioOferta >=
            mejor.precio_unitario
        ) {

            continue;

        }


        mejor = {

            oferta_id:
                oferta.id,

            oferta_nombre:
                oferta.nombre,

            precio_lista:
                precioLista,

            descuento_unitario:
                redondear(
                    precioLista -
                    precioOferta
                ),

            precio_unitario:
                precioOferta

        };

    }


    return mejor;

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

    const combos =
        combosVentaStmt
            .all(
                id
            )
            .map(
                (combo) => {

                    const productos =
                        comboVentaProductosStmt
                            .all(
                                combo.id
                            );


                    const costoTotal =
                        redondear(
                            productos.reduce(
                                (
                                    total,
                                    producto
                                ) =>
                                    total +
                                    producto.costo_unitario *
                                    producto.cantidad,
                                0
                            )
                        );


                    return {

                        ...combo,

                        productos,

                        costo_total:
                            costoTotal,

                        ganancia:
                            redondear(
                                combo.subtotal -
                                costoTotal
                            )

                    };

                }
            );


    const gananciaItems =
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
        );


    const gananciaCombos =
        combos.reduce(
            (
                total,
                combo
            ) =>
                total +
                combo.ganancia,
            0
        );


    const ganancia =
        redondear(
            gananciaItems +
            gananciaCombos
        );


    return {
        ...venta,
        ganancia,
        items,
        combos
    };

}

function obtenerCombosVigentes(
    fecha
) {

    const filas =
        combosVigentesStmt.all({
            fecha
        });


    const mapa =
        new Map();


    for (
        const fila
        of filas
    ) {

        if (
            !mapa.has(
                fila.combo_id
            )
        ) {

            mapa.set(
                fila.combo_id,
                {
                    id:
                        fila.combo_id,

                    nombre:
                        fila.combo_nombre,

                    precio_combo:
                        redondear(
                            fila.precio_combo
                        ),

                    modo_precio:
                        fila.modo_precio ||
                        "FIJO",

                    valor_regla:
                        fila.valor_regla,

                    alcance_descuento:
                        fila.alcance_descuento ||
                        "TOTAL_COMBO",

                    productos:
                        []
                }
            );

        }


        mapa
            .get(
                fila.combo_id
            )
            .productos
            .push({

                producto_id:
                    fila.producto_id,

                cantidad:
                    fila.cantidad

            });

    }


    return [
        ...mapa.values()
    ];

}

function cotizarItems({
    fecha,
    items,
    validarPrecio = false
}) {

    const usados =
        new Set();


    return items.map(
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
                productoVentaStmt.get({

                    productoId:
                        item.productoId,

                    fecha

                });


            if (!producto) {

                throw new Error(
                    "Uno de los productos no tiene precio registrado en la fecha seleccionada."
                );

            }


            if (
                validarPrecio &&
                item.precioId &&
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
                    `No hay stock suficiente de ${producto.nombre}.`
                );

            }


            const precio =
                resolverPrecioOferta(
                    producto,
                    fecha
                );


            const subtotal =
                redondear(

                    precio.precio_unitario *
                    item.cantidad

                );


            return {

                producto,

                producto_id:
                    producto.id,

                producto_nombre:
                    producto.nombre,

                producto_codigo:
                    producto.codigo,

                precio_id:
                    producto.precio_id,

                costo_unitario:
                    producto.costo,

                categoria_id:
                    producto.categoria_id,

                categoria_nombre:
                    producto.categoria_nombre,

                precio_lista:
                    precio.precio_lista,

                precio_unitario:
                    precio.precio_unitario,

                descuento_unitario:
                    precio.descuento_unitario,

                oferta_id:
                    precio.oferta_id,

                oferta_nombre:
                    precio.oferta_nombre,

                stock_actual:
                    producto.stock_actual,

                cantidad:
                    item.cantidad,

                subtotal

            };

        }
    );

}

function calcularPrecioComboVigente(
    combo,
    itemsPorProducto
) {

    const precioLista =
        redondear(
            combo.productos.reduce(
                (
                    total,
                    componente
                ) => {

                    const item =
                        itemsPorProducto.get(
                            componente.producto_id
                        );


                    if (!item) {

                        throw new Error(
                            `No se encontró el producto #${componente.producto_id} del combo "${combo.nombre}".`
                        );

                    }


                    return (
                        total +
                        item.precio_lista *
                        componente.cantidad
                    );

                },
                0
            )
        );


    /*
     * PRECIO FIJO
     *
     * Coca + Alfajor = $10
     */

    if (
        combo.modo_precio ===
        "FIJO"
    ) {

        return {

            precio_lista:
                precioLista,

            precio_combo:
                redondear(
                    combo.precio_combo
                )

        };

    }


    /*
     * DESCUENTO %
     */

    if (
        combo.modo_precio ===
        "DESCUENTO_PORCENTAJE"
    ) {

        const porcentaje =
            Number(
                combo.valor_regla
            );


        if (
            !Number.isFinite(
                porcentaje
            ) ||
            porcentaje <= 0 ||
            porcentaje >= 100
        ) {

            throw new Error(
                `La oferta "${combo.nombre}" tiene un porcentaje inválido.`
            );

        }


        /*
         * Ej:
         *
         * 3 Coca
         * 20% sobre todo el combo
         */

        if (
            combo.alcance_descuento ===
            "TOTAL_COMBO"
        ) {

            return {

                precio_lista:
                    precioLista,

                precio_combo:
                    redondear(
                        precioLista *
                        (
                            1 -
                            porcentaje /
                            100
                        )
                    )

            };

        }


        /*
         * Ej:
         *
         * 3 Coca
         * 20% solamente en la tercera
         */

        if (
            combo.alcance_descuento ===
            "ULTIMA_UNIDAD"
        ) {

            if (
                combo.productos.length !==
                1
            ) {

                throw new Error(
                    `La oferta "${combo.nombre}" aplica descuento en la última unidad pero tiene más de un producto.`
                );

            }


            const componente =
                combo.productos[0];


            const item =
                itemsPorProducto.get(
                    componente.producto_id
                );


            const descuento =
                redondear(
                    item.precio_lista *
                    porcentaje /
                    100
                );


            return {

                precio_lista:
                    precioLista,

                precio_combo:
                    redondear(
                        precioLista -
                        descuento
                    )

            };

        }


        throw new Error(
            `La oferta "${combo.nombre}" tiene un alcance de descuento inválido.`
        );

    }


    /*
     * LLEVÁS X, PAGÁS Y
     *
     * Coca ×2 → pagás 1
     * Coca ×3 → pagás 2
     */

    if (
        combo.modo_precio ===
        "PAGA_UNIDADES"
    ) {

        if (
            combo.productos.length !==
            1
        ) {

            throw new Error(
                `La oferta "${combo.nombre}" de tipo llevás/pagás debe contener un solo producto.`
            );

        }


        const componente =
            combo.productos[0];


        const unidadesLlevadas =
            Number(
                componente.cantidad
            );


        const unidadesPagadas =
            Number(
                combo.valor_regla
            );


        if (
            !Number.isInteger(
                unidadesPagadas
            ) ||
            unidadesPagadas <= 0 ||
            unidadesPagadas >=
            unidadesLlevadas
        ) {

            throw new Error(
                `La oferta "${combo.nombre}" tiene una cantidad a pagar inválida.`
            );

        }


        const item =
            itemsPorProducto.get(
                componente.producto_id
            );


        return {

            precio_lista:
                precioLista,

            precio_combo:
                redondear(
                    item.precio_lista *
                    unidadesPagadas
                )

        };

    }


    throw new Error(
        `La oferta "${combo.nombre}" tiene una modalidad de precio inválida.`
    );

}

function aplicarCombos(
    items,
    fecha
) {

    const itemsPorProducto =
        new Map(
            items.map(
                (item) => [
                    item.producto_id,
                    item
                ]
            )
        );


    const combos =
        obtenerCombosVigentes(
            fecha
        )
            .filter(
                (combo) =>
                    combo.productos
                        .every(
                            (componente) =>
                                itemsPorProducto.has(
                                    componente.producto_id
                                )
                        )
            )
            .map(
                (combo) => {

                    const precio =
                        calcularPrecioComboVigente(
                            combo,
                            itemsPorProducto
                        );


                    return {

                        ...combo,

                        precio_lista_calculado:
                            precio.precio_lista,

                        precio_calculado:
                            precio.precio_combo,
                            

                        unidades_combo:
                            combo.productos.reduce(
                                (
                                    total,
                                    componente
                                ) =>
                                    total +
                                    componente.cantidad,
                                0
                            ),
                            

                    };

                }
            );


    if (
        combos.length === 0
    ) {

        return {
            items,
            combos: []
        };

    }


    const ids =
        items.map(
            (item) =>
                item.producto_id
        );


    const indiceProducto =
        new Map(
            ids.map(
                (id, indice) => [
                    id,
                    indice
                ]
            )
        );


    const cantidadesIniciales =
        items.map(
            (item) =>
                item.cantidad
        );


    const memo =
        new Map();


    const costoSinMasCombos =
        (cantidades) => {

            return redondear(
                cantidades.reduce(
                    (
                        total,
                        cantidad,
                        indice
                    ) =>
                        total +
                        cantidad *
                        items[indice]
                            .precio_unitario,
                    0
                )
            );

        };

    const tieneIdsMenores =
        (
            candidata,
            actual
        ) => {

            const a =
                [
                    ...candidata
                ].sort(
                    (x, y) =>
                        x - y
                );


            const b =
                [
                    ...actual
                ].sort(
                    (x, y) =>
                        x - y
                );


            const limite =
                Math.min(
                    a.length,
                    b.length
                );


            for (
                let i = 0;
                i < limite;
                i += 1
            ) {

                if (
                    a[i] !==
                    b[i]
                ) {

                    return (
                        a[i] <
                        b[i]
                    );

                }

            }


            return (
                a.length <
                b.length
            );

        };


    const esMejorSolucion =
        (
            candidata,
            actual
        ) => {

            if (
                candidata.total <
                actual.total
            ) {

                return true;

            }


            if (
                candidata.total >
                actual.total
            ) {

                return false;

            }

            if (
                candidata.unidades_promocion >
                actual.unidades_promocion
            ) {

                return true;

            }


            if (
                candidata.unidades_promocion <
                actual.unidades_promocion
            ) {

                return false;

            }
            /*
             * Mismo precio:
             * preferimos menos promociones.
             */

            if (
                candidata.aplicaciones <
                actual.aplicaciones
            ) {

                return true;

            }


            if (
                candidata.aplicaciones >
                actual.aplicaciones
            ) {

                return false;

            }


            /*
             * Último desempate:
             * IDs más bajos.
             *
             * Esto hace que el resultado
             * sea completamente determinista.
             */

            return tieneIdsMenores(
                candidata.elecciones,
                actual.elecciones
            );

        };

    const resolver =
        (cantidades) => {

            const clave =
                cantidades.join(",");


            if (
                memo.has(
                    clave
                )
            ) {

                return memo.get(
                    clave
                );

            }


            /*
             * Primera posibilidad:
             * no aplicar ningún combo más.
             *
             * Las unidades restantes quedan
             * con su mejor oferta individual.
             */

            let mejor = {

                total:
                    costoSinMasCombos(
                        cantidades
                    ),

                aplicaciones:
                    0,
                unidades_promocion:
                    0,

                elecciones:
                    []

            };


            for (
                const combo
                of combos
            ) {

                const restantes =
                    [
                        ...cantidades
                    ];


                let puedeAplicarse =
                    true;


                for (
                    const componente
                    of combo.productos
                ) {

                    const indice =
                        indiceProducto.get(
                            componente.producto_id
                        );


                    if (
                        indice === undefined ||
                        restantes[indice] <
                        componente.cantidad
                    ) {

                        puedeAplicarse =
                            false;

                        break;

                    }


                    /*
                     * Estas unidades quedan
                     * reservadas para ESTE combo.
                     *
                     * Ninguna otra promoción
                     * podrá reutilizarlas.
                     */

                    restantes[indice] -=
                        componente.cantidad;

                }


                if (
                    !puedeAplicarse
                ) {

                    continue;

                }


                const siguiente =
                    resolver(
                        restantes
                    );


                const candidata = {

                    total:
                        redondear(
                            combo.precio_calculado +
                            siguiente.total
                        ),

                    aplicaciones:
                        1 +
                        siguiente.aplicaciones,

                    unidades_promocion:
                        combo.unidades_combo +
                        siguiente.unidades_promocion,

                    elecciones: [

                        combo.id,

                        ...siguiente
                            .elecciones

                    ]

                };


                if (
                    esMejorSolucion(
                        candidata,
                        mejor
                    )
                ) {

                    mejor =
                        candidata;

                }

            }


            memo.set(
                clave,
                mejor
            );


            return mejor;

        };


    const mejor =
        resolver(
            cantidadesIniciales
        );


    const cantidadesCombo =
        new Map();


    for (
        const comboId
        of mejor.elecciones
    ) {

        cantidadesCombo.set(
            comboId,

            (
                cantidadesCombo.get(
                    comboId
                ) || 0
            ) + 1
        );

    }


    const consumidos =
        new Map();


    const combosAplicados =
        [];


    for (
        const combo
        of combos
    ) {

        const cantidadCombo =
            cantidadesCombo.get(
                combo.id
            ) || 0;


        if (
            cantidadCombo === 0
        ) {

            continue;

        }


        const productos =
            combo.productos.map(
                (componente) => {

                    const item =
                        itemsPorProducto.get(
                            componente.producto_id
                        );


                    const cantidad =
                        componente.cantidad *
                        cantidadCombo;


                    consumidos.set(

                        componente.producto_id,

                        (
                            consumidos.get(
                                componente.producto_id
                            ) || 0
                        ) +
                        cantidad

                    );


                    return {

                        producto_id:
                            item.producto_id,

                        producto_nombre:
                            item.producto_nombre,

                        cantidad,

                        costo_unitario:
                            item.costo_unitario,

                        precio_lista:
                            item.precio_lista

                    };

                }
            );


        const precioListaUnitario =
            combo.precio_lista_calculado;


        const subtotal =
            redondear(
                combo.precio_calculado *
                cantidadCombo
            );


        const costoTotal =
            redondear(
                productos.reduce(
                    (
                        total,
                        producto
                    ) =>
                        total +
                        producto.costo_unitario *
                        producto.cantidad,
                    0
                )
            );


        const descuentoTotal =
            redondear(
                precioListaUnitario *
                cantidadCombo -
                subtotal
            );


        combosAplicados.push({

            combo_id:
                combo.id,

            combo_nombre:
                combo.nombre,

            modo_precio:
                combo.modo_precio,

            valor_regla:
                combo.valor_regla,

            alcance_descuento:
                combo.alcance_descuento,

            cantidad:
                cantidadCombo,

            precio_lista:
                precioListaUnitario,

            precio_unitario:
                combo.precio_calculado,

            subtotal,

            descuento_total:
                Math.max(
                    0,
                    descuentoTotal
                ),

            costo_total:
                costoTotal,

            ganancia:
                redondear(
                    subtotal -
                    costoTotal
                ),

            productos

        });

    }


    const itemsRestantes =
        items
            .map(
                (item) => {

                    const cantidadConsumida =
                        consumidos.get(
                            item.producto_id
                        ) || 0;


                    const cantidad =
                        item.cantidad -
                        cantidadConsumida;


                    if (
                        cantidad <= 0
                    ) {

                        return null;

                    }


                    return {

                        ...item,

                        cantidad,

                        subtotal:
                            redondear(
                                item.precio_unitario *
                                cantidad
                            )

                    };

                }
            )
            .filter(Boolean);


    return {

        items:
            itemsRestantes,

        combos:
            combosAplicados

    };

}

function resumirCotizacion({
    items,
    combos
}) {

    const totalItems =
        items.reduce(
            (
                total,
                item
            ) =>
                total +
                item.subtotal,
            0
        );


    const totalCombos =
        combos.reduce(
            (
                total,
                combo
            ) =>
                total +
                combo.subtotal,
            0
        );


    const descuentoItems =
        items.reduce(
            (
                total,
                item
            ) =>
                total +
                item.descuento_unitario *
                item.cantidad,
            0
        );


    const descuentoCombos =
        combos.reduce(
            (
                total,
                combo
            ) =>
                total +
                combo.descuento_total,
            0
        );


    const gananciaItems =
        items.reduce(
            (
                total,
                item
            ) =>
                total +
                (
                    item.precio_unitario -
                    item.costo_unitario
                ) *
                item.cantidad,
            0
        );


    const gananciaCombos =
        combos.reduce(
            (
                total,
                combo
            ) =>
                total +
                combo.ganancia,
            0
        );


    return {

        items,

        combos,

        total:
            redondear(
                totalItems +
                totalCombos
            ),

        descuento_total:
            redondear(
                descuentoItems +
                descuentoCombos
            ),

        ganancia:
            redondear(
                gananciaItems +
                gananciaCombos
            )

    };

}


export function cotizarVenta({
    fecha,
    items
}) {

    const normalizados =
        cotizarItems({
            fecha,
            items
        });


    const detalle =
        aplicarCombos(
            normalizados,
            fecha
        );


    const resumen =
        resumirCotizacion(
            detalle
        );


    return {

        ...resumen,

        carrito:
            normalizados.map(
                ({
                    producto,
                    ...item
                }) =>
                    item
            )

    };

}
export function buscarProductosVenta({ busqueda = "", limite = 30, fecha }) {

    const texto =
        busqueda.trim();


    return buscarProductosStmt.all({

        busqueda:
            texto,

        patron:
            `%${texto}%`,

        fecha,

        limite

    }).map(
        (producto) => {

            const precio =
                resolverPrecioOferta(
                    producto,
                    fecha
                );


            return {

                ...producto,

                precio_lista:
                    precio.precio_lista,

                precio_venta:
                    precio.precio_unitario,

                descuento_unitario:
                    precio.descuento_unitario,

                oferta_id:
                    precio.oferta_id,

                oferta_nombre:
                    precio.oferta_nombre

            };

        }
    );

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


        const normalizados =
            cotizarItems({

                fecha,

                items,

                validarPrecio:
                    true

            });


        const detalle =
            aplicarCombos(
                normalizados,
                fecha
            );


        const cotizacion =
            resumirCotizacion(
                detalle
            );


        const {
            total
        } =
            cotizacion;

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
            of cotizacion.items
        ) {
            crearItemStmt.run(

    venta.id,

    item.producto_id,

    item.categoria_id,

    item.categoria_nombre,

    item.precio_id,

    item.oferta_id,

    item.oferta_nombre,

    item.cantidad,

    item.costo_unitario,

    item.precio_lista,

    item.descuento_unitario,

    item.precio_unitario,

    item.subtotal

);
        }
        for (
            const combo
            of cotizacion.combos
        ) {

            const comboVenta =
                crearComboVentaStmt.get(

                    venta.id,

                    combo.combo_id,

                    combo.combo_nombre,

                    combo.cantidad,

                    combo.precio_unitario,

                    combo.subtotal

                );


            for (
                const producto
                of combo.productos
            ) {

               crearComboVentaProductoStmt.run(

    comboVenta.id,

    producto.producto_id,

    producto.producto_nombre,

    producto.categoria_id,

    producto.categoria_nombre,

    producto.cantidad,

    producto.costo_unitario

);

            }

        }
        const fechaMovimientoStock =
            new Date()
                .toISOString();
        for (
            const item
            of normalizados
        ) {

            const producto =
                item.producto;


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

                `Venta #${venta.id} · Fecha venta: ${fecha}`,

                fechaMovimientoStock

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
                ventaId,
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