import db
    from "../database.js";


const listaPendienteStmt =
    db.prepare(`
        SELECT
            id,
            estado,
            fecha_creacion,
            fecha_completada,
            notas

        FROM lista_compras

        WHERE estado = 'PENDIENTE'

        ORDER BY id DESC

        LIMIT 1
    `);


const crearListaStmt =
    db.prepare(`
        INSERT INTO lista_compras (
            estado,
            fecha_creacion,
            notas
        )

        VALUES (
            'PENDIENTE',
            ?,
            NULL
        )

        RETURNING
            id,
            estado,
            fecha_creacion,
            fecha_completada,
            notas
    `);


const listaPorIdStmt =
    db.prepare(`
        SELECT
            id,
            estado,
            fecha_creacion,
            fecha_completada,
            notas

        FROM lista_compras

        WHERE id = ?
    `);


const itemsListaStmt =
    db.prepare(`
        SELECT
            i.id,
            i.lista_id,
            i.producto_id,
            i.nombre,
            i.cantidad,
            i.comprado,

            p.codigo,
            p.stock_actual,
            p.stock_minimo,
            p.unidad

        FROM items_lista_compras i

        LEFT JOIN productos p
            ON p.id = i.producto_id

        WHERE i.lista_id = ?

        ORDER BY
            i.comprado ASC,
            i.id ASC
    `);


const productoActivoStmt =
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


const itemProductoStmt =
    db.prepare(`
        SELECT
            id,
            cantidad

        FROM items_lista_compras

        WHERE
            lista_id = ?
            AND producto_id = ?

        LIMIT 1
    `);


const itemLibreStmt =
    db.prepare(`
        SELECT
            id,
            cantidad

        FROM items_lista_compras

        WHERE
            lista_id = ?
            AND producto_id IS NULL
            AND LOWER(TRIM(nombre))
                = LOWER(TRIM(?))

        LIMIT 1
    `);


const insertarItemStmt =
    db.prepare(`
        INSERT INTO items_lista_compras (
            lista_id,
            producto_id,
            nombre,
            cantidad,
            comprado
        )

        VALUES (
            ?, ?, ?, ?, 0
        )

        RETURNING id
    `);


const actualizarCantidadItemStmt =
    db.prepare(`
        UPDATE items_lista_compras

        SET
            cantidad = ?,
            comprado = 0

        WHERE id = ?
    `);


const itemPendienteStmt =
    db.prepare(`
        SELECT
            i.id,
            i.lista_id

        FROM items_lista_compras i

        INNER JOIN lista_compras l
            ON l.id = i.lista_id

        WHERE
            i.id = ?
            AND l.estado = 'PENDIENTE'
    `);


const marcarCompradoStmt =
    db.prepare(`
        UPDATE items_lista_compras

        SET comprado = ?

        WHERE id = ?
    `);


const eliminarItemStmt =
    db.prepare(`
        DELETE FROM items_lista_compras

        WHERE id = ?
    `);


const actualizarNotasStmt =
    db.prepare(`
        UPDATE lista_compras

        SET notas = ?

        WHERE
            id = ?
            AND estado = 'PENDIENTE'
    `);


const historialStmt =
    db.prepare(`
        SELECT
            l.id,
            l.estado,
            l.fecha_creacion,
            l.fecha_completada,
            l.notas,

            COUNT(i.id)
                AS total_items,

            COALESCE(
                SUM(
                    CASE
                        WHEN i.comprado = 1
                        THEN 1
                        ELSE 0
                    END
                ),
                0
            ) AS comprados

        FROM lista_compras l

        LEFT JOIN items_lista_compras i
            ON i.lista_id = l.id

        WHERE l.estado = 'COMPLETADA'

        GROUP BY l.id

        ORDER BY
            l.fecha_completada DESC,
            l.id DESC

        LIMIT 30
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
    `);


const pendientesListaStmt =
    db.prepare(`
        SELECT
            producto_id,
            nombre,
            cantidad

        FROM items_lista_compras

        WHERE
            lista_id = ?
            AND comprado = 0
    `);


const contarItemsStmt =
    db.prepare(`
        SELECT
            COUNT(*) AS total

        FROM items_lista_compras

        WHERE lista_id = ?
    `);


const completarListaStmt =
    db.prepare(`
        UPDATE lista_compras

        SET
            estado = 'COMPLETADA',
            fecha_completada = ?

        WHERE
            id = ?
            AND estado = 'PENDIENTE'
    `);


function ahora() {

    return new Date().toISOString();

}


function obtenerOCrearPendiente() {

    let lista =
        listaPendienteStmt.get();


    if (!lista) {

        lista =
            crearListaStmt.get(
                ahora()
            );

    }


    return lista;

}


function obtenerListaCompleta(id) {

    const lista =
        listaPorIdStmt.get(id);


    if (!lista) {

        throw new Error(
            "La lista de compras no existe."
        );

    }


    return {
        ...lista,

        items:
            itemsListaStmt.all(id)
    };

}


function validarItemPendiente(itemId) {

    const item =
        itemPendienteStmt.get(
            itemId
        );


    if (!item) {

        throw new Error(
            "El ítem no existe o la lista ya fue cerrada."
        );

    }


    return item;

}


function agregarProductoInterno(
    listaId,
    producto,
    cantidad,
    sumar = true
) {

    const existente =
        itemProductoStmt.get(
            listaId,
            producto.id
        );


    if (existente) {

        const nuevaCantidad =
            sumar
                ? existente.cantidad +
                    cantidad
                : Math.max(
                    existente.cantidad,
                    cantidad
                );


        actualizarCantidadItemStmt.run(
            nuevaCantidad,
            existente.id
        );


        return;
    }


    insertarItemStmt.run(
        listaId,
        producto.id,
        producto.nombre,
        cantidad
    );

}


export function obtenerListaActual() {

    const lista =
        obtenerOCrearPendiente();


    return obtenerListaCompleta(
        lista.id
    );

}


const agregarProductoTransaction =
    db.transaction(({
        productoId,
        cantidad
    }) => {

        const lista =
            obtenerOCrearPendiente();


        const producto =
            productoActivoStmt.get(
                productoId
            );


        if (!producto) {

            throw new Error(
                "El producto no existe."
            );

        }


        agregarProductoInterno(
            lista.id,
            producto,
            cantidad,
            true
        );


        return obtenerListaCompleta(
            lista.id
        );

    });


export function agregarProducto(datos) {

    return agregarProductoTransaction(
        datos
    );

}


const agregarLibreTransaction =
    db.transaction(({
        nombre,
        cantidad
    }) => {

        const lista =
            obtenerOCrearPendiente();


        const existente =
            itemLibreStmt.get(
                lista.id,
                nombre
            );


        if (existente) {

            actualizarCantidadItemStmt.run(
                existente.cantidad +
                    cantidad,
                existente.id
            );

        } else {

            insertarItemStmt.run(
                lista.id,
                null,
                nombre,
                cantidad
            );

        }


        return obtenerListaCompleta(
            lista.id
        );

    });


export function agregarItemLibre(datos) {

    return agregarLibreTransaction(
        datos
    );

}


export function actualizarCantidad({
    itemId,
    cantidad
}) {

    const item =
        validarItemPendiente(
            itemId
        );


    actualizarCantidadItemStmt.run(
        cantidad,
        itemId
    );


    return obtenerListaCompleta(
        item.lista_id
    );

}


export function marcarComprado({
    itemId,
    comprado
}) {

    const item =
        validarItemPendiente(
            itemId
        );


    marcarCompradoStmt.run(
        comprado ? 1 : 0,
        itemId
    );


    return obtenerListaCompleta(
        item.lista_id
    );

}


export function eliminarItem(itemId) {

    const item =
        validarItemPendiente(
            itemId
        );


    eliminarItemStmt.run(
        itemId
    );


    return obtenerListaCompleta(
        item.lista_id
    );

}


export function actualizarNotas(
    notas
) {

    const lista =
        obtenerOCrearPendiente();


    actualizarNotasStmt.run(
        notas,
        lista.id
    );


    return obtenerListaCompleta(
        lista.id
    );

}


const agregarStockBajoTransaction =
    db.transaction(() => {

        const lista =
            obtenerOCrearPendiente();


        const productos =
            stockBajoStmt.all();


        for (
            const producto
            of productos
        ) {

            const cantidadSugerida =
                Math.max(
                    1,

                    producto.stock_minimo +
                    1 -
                    producto.stock_actual
                );


            agregarProductoInterno(
                lista.id,
                producto,
                cantidadSugerida,
                false
            );

        }


        return {
            agregados:
                productos.length,

            lista:
                obtenerListaCompleta(
                    lista.id
                )
        };

    });


export function agregarProductosStockBajo() {

    return agregarStockBajoTransaction();

}


export function listarHistorial() {

    return historialStmt.all();

}


export function obtenerLista(id) {

    return obtenerListaCompleta(
        id
    );

}


const completarListaTransaction =
    db.transaction(() => {

        const lista =
            obtenerOCrearPendiente();


        const {
            total
        } =
            contarItemsStmt.get(
                lista.id
            );


        if (total === 0) {

            throw new Error(
                "No se puede finalizar una lista vacía."
            );

        }


        const pendientes =
            pendientesListaStmt.all(
                lista.id
            );


        completarListaStmt.run(
            ahora(),
            lista.id
        );


        let nuevaListaId =
            null;


        if (pendientes.length > 0) {

            const nuevaLista =
                crearListaStmt.get(
                    ahora()
                );


            nuevaListaId =
                nuevaLista.id;


            for (
                const item
                of pendientes
            ) {

                insertarItemStmt.run(
                    nuevaLista.id,
                    item.producto_id,
                    item.nombre,
                    item.cantidad
                );

            }

        }


        return {
            success: true,

            lista_completada_id:
                lista.id,

            nueva_lista_id:
                nuevaListaId
        };

    });


export function completarLista() {

    return completarListaTransaction();

}