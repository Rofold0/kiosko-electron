import db
    from "../database.js";


const proveedorStmt =
    db.prepare(`
        SELECT
            id,
            nombre

        FROM proveedores

        WHERE
            id = ?
            AND activo = 1
    `);


const productoProveedorStmt =
    db.prepare(`
        SELECT
            p.id,
            p.nombre,
            p.codigo,
            p.stock_actual,
            p.unidad,

            pp.id AS vinculo_id,
            pp.ultimo_costo

        FROM productos p

        INNER JOIN productos_proveedores pp
            ON pp.producto_id = p.id

        WHERE
            p.id = ?
            AND pp.proveedor_id = ?
            AND p.activo = 1
    `);


const crearCompraStmt =
    db.prepare(`
        INSERT INTO compras (
            proveedor_id,
            fecha,
            total,
            notas
        )

        VALUES (
            ?, ?, ?, ?
        )

        RETURNING id
    `);


const crearItemStmt =
    db.prepare(`
        INSERT INTO items_compra (
            compra_id,
            producto_id,
            lista_item_id,
            producto_proveedor_id,

            cantidad,
            costo_unitario,
            subtotal,

            costo_anterior_proveedor,
            lista_cantidad_anterior,
            lista_comprado_anterior
        )

        VALUES (
            ?, ?, ?, ?,
            ?, ?, ?,
            ?, ?, ?
        )
    `);


const actualizarStockStmt =
    db.prepare(`
        UPDATE productos

        SET stock_actual = ?

        WHERE
            id = ?
            AND activo = 1
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


const actualizarUltimoCostoStmt =
    db.prepare(`
        UPDATE productos_proveedores

        SET ultimo_costo = ?

        WHERE
            producto_id = ?
            AND proveedor_id = ?
    `);


const listaItemStmt =
    db.prepare(`
        SELECT
            i.id,
            i.producto_id,
            i.cantidad,
            i.comprado,
            l.estado

        FROM items_lista_compras i

        INNER JOIN lista_compras l
            ON l.id = i.lista_id

        WHERE i.id = ?
    `);


const completarListaItemStmt =
    db.prepare(`
        UPDATE items_lista_compras

        SET comprado = 1

        WHERE id = ?
    `);


const reducirListaItemStmt =
    db.prepare(`
        UPDATE items_lista_compras

        SET
            cantidad = cantidad - ?,
            comprado = 0

        WHERE id = ?
    `);


const pendientesProveedorStmt =
    db.prepare(`
        SELECT
            i.id
                AS lista_item_id,

            i.producto_id,

            i.nombre,

            i.cantidad,

            p.codigo,

            p.stock_actual,

            p.unidad,

            pp.ultimo_costo

        FROM lista_compras l

        INNER JOIN items_lista_compras i
            ON i.lista_id = l.id

        INNER JOIN productos p
            ON p.id = i.producto_id

        INNER JOIN productos_proveedores pp
            ON pp.producto_id = p.id

        WHERE
            l.estado = 'PENDIENTE'

            AND i.comprado = 0

            AND p.activo = 1

            AND pp.proveedor_id = ?

        ORDER BY
            i.id ASC
    `);


const listarComprasStmt =
    db.prepare(`
        SELECT
            c.id,
            c.proveedor_id,
            c.fecha,
            c.total,
            c.notas,

            p.nombre
                AS proveedor_nombre,

            COUNT(ic.id)
                AS total_items,

            COALESCE(
                SUM(ic.cantidad),
                0
            ) AS total_unidades,

            c.estado,
            c.fecha_reversion,
            c.motivo_reversion

        FROM compras c

        LEFT JOIN proveedores p
            ON p.id = c.proveedor_id

        LEFT JOIN items_compra ic
            ON ic.compra_id = c.id

        WHERE
            (
                @proveedorId IS NULL
                OR
                c.proveedor_id =
                    @proveedorId
            )

        GROUP BY c.id

        ORDER BY
            c.fecha DESC,
            c.id DESC

        LIMIT @limite
        OFFSET @offset
    `);


const contarComprasStmt =
    db.prepare(`
        SELECT
            COUNT(*) AS total

        FROM compras

        WHERE
            (
                @proveedorId IS NULL
                OR
                proveedor_id =
                    @proveedorId
            )
    `);


const compraStmt =
    db.prepare(`
        SELECT
            c.id,
            c.proveedor_id,
            c.fecha,
            c.total,
            c.notas,

            p.nombre
                AS proveedor_nombre,

            c.estado,
            c.fecha_reversion,
            c.motivo_reversion

        FROM compras c

        LEFT JOIN proveedores p
            ON p.id = c.proveedor_id

        WHERE c.id = ?
    `);


const itemsCompraStmt =
    db.prepare(`
        SELECT
            ic.id,
            ic.producto_id,
            ic.lista_item_id,
            ic.cantidad,
            ic.costo_unitario,
            ic.subtotal,
            ic.producto_proveedor_id,
            ic.costo_anterior_proveedor,
            ic.lista_cantidad_anterior,
            ic.lista_comprado_anterior,

            p.nombre
                AS producto_nombre,

            p.codigo
                AS producto_codigo,

            p.unidad

        FROM items_compra ic

        INNER JOIN productos p
            ON p.id = ic.producto_id

        WHERE
            ic.compra_id = ?

        ORDER BY
            p.nombre COLLATE NOCASE ASC
    `);

const compraReversionStmt =
    db.prepare(`
        SELECT
            c.id,
            c.proveedor_id,
            c.fecha,
            c.total,
            c.estado,

            p.nombre
                AS proveedor_nombre

        FROM compras c

        LEFT JOIN proveedores p
            ON p.id = c.proveedor_id

        WHERE c.id = ?
    `);


const itemsReversionStmt =
    db.prepare(`
        SELECT
            ic.id,
            ic.producto_id,
            ic.lista_item_id,
            ic.producto_proveedor_id,

            ic.cantidad,
            ic.costo_anterior_proveedor,
            ic.lista_cantidad_anterior,
            ic.lista_comprado_anterior,

            p.nombre
                AS producto_nombre,

            p.stock_actual

        FROM items_compra ic

        INNER JOIN productos p
            ON p.id = ic.producto_id

        WHERE ic.compra_id = ?
    `);


const marcarCompraRevertidaStmt =
    db.prepare(`
        UPDATE compras

        SET
            estado = 'REVERTIDA',
            fecha_reversion = ?,
            motivo_reversion = ?

        WHERE
            id = ?
            AND estado = 'ACTIVA'
    `);


const actualizarStockReversionStmt =
    db.prepare(`
        UPDATE productos

        SET stock_actual = ?

        WHERE id = ?
    `);


const compraPosteriorActivaStmt =
    db.prepare(`
        SELECT 1

        FROM items_compra ic

        INNER JOIN compras c
            ON c.id = ic.compra_id

        WHERE
            c.proveedor_id = ?
            AND ic.producto_id = ?
            AND c.id > ?
            AND c.estado = 'ACTIVA'

        LIMIT 1
    `);


const restaurarCostoStmt =
    db.prepare(`
        UPDATE productos_proveedores

        SET ultimo_costo = ?

        WHERE id = ?
    `);


const listaItemActualStmt =
    db.prepare(`
        SELECT
            i.id,
            i.cantidad,
            i.comprado,
            l.estado

        FROM items_lista_compras i

        INNER JOIN lista_compras l
            ON l.id = i.lista_id

        WHERE i.id = ?
    `);


const restaurarListaItemStmt =
    db.prepare(`
        UPDATE items_lista_compras

        SET
            cantidad = ?,
            comprado = ?

        WHERE id = ?
    `);

const revertirCompraTransaction =
    db.transaction(({
        compraId,
        motivo
    }) => {

        const compra =
            compraReversionStmt.get(
                compraId
            );


        if (!compra) {

            throw new Error(
                "La compra no existe."
            );

        }


        if (
            compra.estado ===
            "REVERTIDA"
        ) {

            throw new Error(
                "La compra ya fue revertida."
            );

        }


        const items =
            itemsReversionStmt.all(
                compraId
            );


        if (items.length === 0) {

            throw new Error(
                "La compra no tiene productos."
            );

        }


        // Primero validamos TODO.
        // Todavía no modificamos nada.

        for (const item of items) {

            if (
                item.stock_actual <
                item.cantidad
            ) {

                throw new Error(
                    `No se puede revertir la compra. ` +
                    `${item.producto_nombre} tiene stock ${item.stock_actual} ` +
                    `y sería necesario retirar ${item.cantidad}.`
                );

            }

        }


        const fechaReversion =
            new Date()
                .toISOString();


        let listasNoRestauradas =
            0;


        for (const item of items) {

            // STOCK

            const stockAnterior =
                item.stock_actual;


            const stockNuevo =
                stockAnterior -
                item.cantidad;


            actualizarStockReversionStmt.run(

                stockNuevo,

                item.producto_id

            );


            movimientoStockStmt.run(

                item.producto_id,

                "REVERSA_COMPRA",

                -item.cantidad,

                stockAnterior,

                stockNuevo,

                `Reversión compra #${compra.id}: ${motivo}`,

                fechaReversion

            );


            // ULTIMO COSTO DEL PROVEEDOR

            if (
                item.producto_proveedor_id
                !== null
            ) {

                const hayCompraPosterior =
                    compraPosteriorActivaStmt.get(

                        compra.proveedor_id,

                        item.producto_id,

                        compra.id

                    );


                /*
                 * Sólo restauramos costo si
                 * ninguna compra posterior
                 * activa lo volvió a cambiar.
                 */

                if (!hayCompraPosterior) {

                    restaurarCostoStmt.run(

                        item.costo_anterior_proveedor,

                        item.producto_proveedor_id

                    );

                }

            }


            // LISTA DE COMPRAS

            if (
                item.lista_item_id !== null &&
                item.lista_cantidad_anterior
                    !== null &&
                item.lista_comprado_anterior
                    !== null
            ) {

                const listaActual =
                    listaItemActualStmt.get(
                        item.lista_item_id
                    );


                if (
                    listaActual &&
                    listaActual.estado ===
                        "PENDIENTE"
                ) {

                    /*
                     * Calculamos cómo debería
                     * haber quedado después
                     * de la compra.
                     */

                    const compraCompleta =
                        item.cantidad >=
                        item.lista_cantidad_anterior;


                    const cantidadEsperada =
                        compraCompleta
                            ? item.lista_cantidad_anterior
                            : item.lista_cantidad_anterior -
                                item.cantidad;


                    const compradoEsperado =
                        compraCompleta
                            ? 1
                            : 0;


                    /*
                     * Sólo restauramos si
                     * nadie volvió a modificar
                     * el ítem después.
                     */

                    if (
                        listaActual.cantidad ===
                            cantidadEsperada &&
                        listaActual.comprado ===
                            compradoEsperado
                    ) {

                        restaurarListaItemStmt.run(

                            item.lista_cantidad_anterior,

                            item.lista_comprado_anterior,

                            item.lista_item_id

                        );


                    } else {

                        listasNoRestauradas++;

                    }


                } else {

                    listasNoRestauradas++;

                }

            }

        }


        const resultado =
            marcarCompraRevertidaStmt.run(

                fechaReversion,

                motivo,

                compra.id

            );


        if (
            resultado.changes !== 1
        ) {

            throw new Error(
                "No se pudo revertir la compra."
            );

        }


        return {

            compra:
                obtenerCompraCompleta(
                    compra.id
                ),

            listas_no_restauradas:
                listasNoRestauradas

        };

    });

function redondearMoneda(valor) {

    return Math.round(
        (
            valor +
            Number.EPSILON
        ) * 100
    ) / 100;

}


function obtenerCompraCompleta(id) {

    const compra =
        compraStmt.get(id);


    if (!compra) {

        throw new Error(
            "La compra no existe."
        );

    }


    return {
        ...compra,

        items:
            itemsCompraStmt.all(id)
    };

}


const registrarCompraTransaction =
    db.transaction(({
        proveedorId,
        fecha,
        notas,
        items
    }) => {

        const proveedor =
            proveedorStmt.get(
                proveedorId
            );


        if (!proveedor) {

            throw new Error(
                "El proveedor no existe."
            );

        }


        if (
            !Array.isArray(items) ||
            items.length === 0
        ) {

            throw new Error(
                "La compra no tiene productos."
            );

        }


        const productosUsados =
            new Set();


        const normalizados =
            items.map((item) => {

                if (
                    productosUsados.has(
                        item.productoId
                    )
                ) {

                    throw new Error(
                        "Hay un producto repetido en la compra."
                    );

                }


                productosUsados.add(
                    item.productoId
                );


                const producto =
                    productoProveedorStmt.get(
                        item.productoId,
                        proveedorId
                    );


                if (!producto) {

                    throw new Error(
                        "Uno de los productos no pertenece al proveedor seleccionado."
                    );

                }


                const subtotal =
                    redondearMoneda(
                        item.cantidad *
                        item.costoUnitario
                    );

                let listaItem =
                    null;


                if (item.listaItemId !== null) {

                    listaItem =
                        listaItemStmt.get(
                            item.listaItemId
                        );


                    if (
                        !listaItem ||
                        listaItem.estado !==
                        "PENDIENTE" ||
                        listaItem.comprado === 1 ||
                        listaItem.producto_id !==
                        item.productoId
                    ) {

                        throw new Error(
                            "Un ítem de la lista de compras cambió antes de registrar la compra."
                        );

                    }

                }
                return {
                    ...item,

                    producto,

                    listaItem,

                    subtotal
                };

            });


        const total =
            redondearMoneda(
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


        const compra =
            crearCompraStmt.get(
                proveedorId,
                fecha,
                total,
                notas
            );


        for (
            const item
            of normalizados
        ) {

            crearItemStmt.run(

                compra.id,

                item.productoId,

                item.listaItemId,

                item.producto.vinculo_id,

                item.cantidad,

                item.costoUnitario,

                item.subtotal,

                item.producto.ultimo_costo,

                item.listaItem
                    ?.cantidad ?? null,

                item.listaItem
                    ?.comprado ?? null

            );


            const stockAnterior =
                item.producto
                    .stock_actual;


            const stockNuevo =
                stockAnterior +
                item.cantidad;


            actualizarStockStmt.run(
                stockNuevo,
                item.productoId
            );


            movimientoStockStmt.run(
                item.productoId,
                "COMPRA",
                item.cantidad,
                stockAnterior,
                stockNuevo,
                `Compra #${compra.id} - ${proveedor.nombre}`,
                fecha
            );


            actualizarUltimoCostoStmt.run(
                item.costoUnitario,
                item.productoId,
                proveedorId
            );


            if (
                item.listaItemId !== null
            ) {

                const listaItem =
                    listaItemStmt.get(
                        item.listaItemId
                    );


                if (
                    !listaItem ||
                    listaItem.estado !==
                    "PENDIENTE" ||
                    listaItem.comprado === 1 ||
                    listaItem.producto_id !==
                    item.productoId
                ) {

                    throw new Error(
                        "Un ítem de la lista de compras cambió antes de registrar la compra."
                    );

                }


                if (
                    item.cantidad >=
                    listaItem.cantidad
                ) {

                    completarListaItemStmt.run(
                        listaItem.id
                    );


                } else {

                    reducirListaItemStmt.run(
                        item.cantidad,
                        listaItem.id
                    );

                }

            }

        }


        return obtenerCompraCompleta(
            compra.id
        );

    });


export function registrarCompra(datos) {

    return registrarCompraTransaction(
        datos
    );

}


export function listarPendientesProveedor(
    proveedorId
) {

    const proveedor =
        proveedorStmt.get(
            proveedorId
        );


    if (!proveedor) {

        throw new Error(
            "El proveedor no existe."
        );

    }


    return pendientesProveedorStmt.all(
        proveedorId
    );

}


export function listarCompras({
    proveedorId = null,
    limite = 25,
    offset = 0
}) {

    const parametros = {

        proveedorId,

        limite,

        offset

    };


    const items =
        listarComprasStmt.all(
            parametros
        );


    const {
        total
    } =
        contarComprasStmt.get(
            parametros
        );


    return {
        items,
        total
    };

}


export function obtenerCompra(id) {

    return obtenerCompraCompleta(
        id
    );

}
export function revertirCompra({
    compraId,
    motivo
}) {

    return revertirCompraTransaction({

        compraId,
        motivo

    });

}