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
            cantidad,
            costo_unitario,
            subtotal
        )

        VALUES (
            ?, ?, ?, ?, ?, ?
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
            ) AS total_unidades

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
                AS proveedor_nombre

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


                return {
                    ...item,

                    producto,

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
                item.cantidad,
                item.costoUnitario,
                item.subtotal
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