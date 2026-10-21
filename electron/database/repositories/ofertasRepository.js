import db
    from "../database.js";


const listarStmt =
    db.prepare(`
        SELECT
            o.id,
            o.nombre,
            o.tipo,
            o.valor,

            o.fecha_desde,
            o.fecha_hasta,

            o.activo,

            o.creado_en,
            o.actualizado_en,

            COUNT(
                op.producto_id
            ) AS total_productos

        FROM ofertas o

        LEFT JOIN ofertas_productos op
            ON op.oferta_id =
                o.id

        GROUP BY
            o.id

        ORDER BY
            o.activo DESC,
            o.fecha_desde DESC,
            o.id DESC
    `);


const ofertaStmt =
    db.prepare(`
        SELECT
            id,
            nombre,
            tipo,
            valor,
            fecha_desde,
            fecha_hasta,
            activo,
            creado_en,
            actualizado_en

        FROM ofertas

        WHERE id = ?
    `);


const productosOfertaStmt =
    db.prepare(`
        SELECT
            p.id,
            p.nombre,
            p.codigo,
            pr.costo,
            pr.precio_venta

        FROM ofertas_productos op

        INNER JOIN productos p
            ON p.id =
                op.producto_id

        LEFT JOIN precios pr
            ON pr.producto_id =
                p.id

            AND pr.fecha_hasta
                IS NULL

        WHERE
            op.oferta_id = ?

        ORDER BY
            p.nombre COLLATE NOCASE
    `);


const buscarProductosStmt =
    db.prepare(`
        SELECT
            p.id,
            p.nombre,
            p.codigo,

            pr.costo,
            pr.precio_venta

        FROM productos p

        LEFT JOIN precios pr
            ON pr.producto_id =
                p.id

            AND pr.fecha_hasta
                IS NULL

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
            p.nombre COLLATE NOCASE

        LIMIT @limite
    `);


const productoActivoStmt =
    db.prepare(`
        SELECT id

        FROM productos

        WHERE
            id = ?
            AND activo = 1
    `);


const crearStmt =
    db.prepare(`
        INSERT INTO ofertas (
            nombre,
            tipo,
            valor,
            fecha_desde,
            fecha_hasta,
            activo,
            creado_en,
            actualizado_en
        )

        VALUES (
            ?, ?, ?, ?, ?,
            1,
            ?, ?
        )

        RETURNING id
    `);


const actualizarStmt =
    db.prepare(`
        UPDATE ofertas

        SET
            nombre = ?,
            tipo = ?,
            valor = ?,
            fecha_desde = ?,
            fecha_hasta = ?,
            actualizado_en = ?

        WHERE id = ?

        RETURNING id
    `);


const cambiarActivoStmt =
    db.prepare(`
        UPDATE ofertas

        SET
            activo = ?,
            actualizado_en = ?

        WHERE id = ?

        RETURNING id
    `);


const eliminarProductosStmt =
    db.prepare(`
        DELETE FROM ofertas_productos

        WHERE oferta_id = ?
    `);


const insertarProductoStmt =
    db.prepare(`
        INSERT INTO ofertas_productos (
            oferta_id,
            producto_id
        )

        VALUES (?, ?)
    `);

const listarCombosStmt =
    db.prepare(`
        SELECT
            c.id,
            c.nombre,

            'COMBO'
                AS tipo,

            c.precio_combo
                AS valor,
                
            c.modo_precio,
            c.alcance_descuento,

            c.valor_regla,
            c.alcance_descuento,

            c.fecha_desde,
            c.fecha_hasta,

            c.activo,

            c.creado_en,
            c.actualizado_en,

            COUNT(
                cp.producto_id
            ) AS total_productos

        FROM ofertas_combo c

        LEFT JOIN ofertas_combo_productos cp
            ON cp.combo_id =
                c.id

        GROUP BY
            c.id
    `);


const comboStmt =
    db.prepare(`
        SELECT
            id,
            nombre,

            'COMBO'
                AS tipo,

            precio_combo
                AS valor,

            c.modo_precio,
            c.valor_regla,
            c.alcance_descuento,

            fecha_desde,
            fecha_hasta,

            activo,

            creado_en,
            actualizado_en

        FROM ofertas_combo

        WHERE id = ?
    `);


const productosComboStmt =
    db.prepare(`
        SELECT
            p.id,
            p.nombre,
            p.codigo,

            pr.costo,
            pr.precio_venta,

            cp.cantidad

        FROM ofertas_combo_productos cp

        INNER JOIN productos p
            ON p.id =
                cp.producto_id

        LEFT JOIN precios pr
            ON pr.producto_id =
                p.id

            AND pr.fecha_hasta
                IS NULL

        WHERE
            cp.combo_id = ?

        ORDER BY
            p.nombre
                COLLATE NOCASE
    `);


const crearComboStmt =
    db.prepare(`
        INSERT INTO ofertas_combo (
            nombre,
            precio_combo,

            modo_precio,
            valor_regla,
            alcance_descuento,

            fecha_desde,
            fecha_hasta,

            activo,

            creado_en,
            actualizado_en
        )

        VALUES (
            ?, ?,
            ?, ?, ?,
            ?, ?,
            1,
            ?, ?
        )

        RETURNING id
    `);


const actualizarComboStmt =
    db.prepare(`
        UPDATE ofertas_combo

        SET
            nombre = ?,
            precio_combo = ?,

            modo_precio = ?,
            valor_regla = ?,
            alcance_descuento = ?,

            fecha_desde = ?,
            fecha_hasta = ?,

            actualizado_en = ?

        WHERE id = ?

        RETURNING id
    `);


const cambiarActivoComboStmt =
    db.prepare(`
        UPDATE ofertas_combo

        SET
            activo = ?,
            actualizado_en = ?

        WHERE id = ?

        RETURNING id
    `);


const eliminarProductosComboStmt =
    db.prepare(`
        DELETE FROM ofertas_combo_productos

        WHERE combo_id = ?
    `);


const insertarProductoComboStmt =
    db.prepare(`
        INSERT INTO ofertas_combo_productos (
            combo_id,
            producto_id,
            cantidad
        )

        VALUES (?, ?, ?)
    `);

function estadoVigencia(
    oferta
) {

    if (!oferta.activo) {
        return "INACTIVA";
    }


    const ahora =
        new Date()
            .toISOString();


    if (
        ahora <
        oferta.fecha_desde
    ) {

        return "PROGRAMADA";

    }


    if (
        ahora >=
        oferta.fecha_hasta
    ) {

        return "VENCIDA";

    }


    return "ACTIVA";

}


export function obtenerOferta(
    id,
    tipo = null
) {

    if (
        tipo ===
        "COMBO"
    ) {

        const combo =
            comboStmt.get(
                id
            );


        if (!combo) {

            throw new Error(
                "El combo no existe."
            );

        }


        return {

            ...combo,

            estado_vigencia:
                estadoVigencia(
                    combo
                ),

            productos:
                productosComboStmt
                    .all(
                        id
                    )

        };

    }


    const oferta =
        ofertaStmt.get(
            id
        );


    if (!oferta) {

        throw new Error(
            "La oferta no existe."
        );

    }


    return {

        ...oferta,

        estado_vigencia:
            estadoVigencia(
                oferta
            ),

        productos:
            productosOfertaStmt
                .all(
                    id
                )

    };

}


export function listarOfertas() {

    const normales =
        listarStmt
            .all()
            .map(
                (oferta) => ({

                    ...oferta,

                    estado_vigencia:
                        estadoVigencia(
                            oferta
                        )

                })
            );


    const combos =
        listarCombosStmt
            .all()
            .map(
                (oferta) => ({

                    ...oferta,

                    estado_vigencia:
                        estadoVigencia(
                            oferta
                        )

                })
            );


    return [
        ...normales,
        ...combos
    ].sort(
        (a, b) => {

            if (
                Number(a.activo) !==
                Number(b.activo)
            ) {

                return (
                    Number(b.activo) -
                    Number(a.activo)
                );

            }


            return (
                String(
                    b.fecha_desde
                )
                    .localeCompare(
                        String(
                            a.fecha_desde
                        )
                    )
            );

        }
    );

}


export function buscarProductosOferta({
    busqueda = "",
    limite = 50
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


function validarProductos(
    productoIds
) {

    for (
        const id
        of productoIds
    ) {

        if (
            !productoActivoStmt.get(
                id
            )
        ) {

            throw new Error(
                `El producto #${id} no existe o está desactivado.`
            );

        }

    }

}


function guardarProductos(
    ofertaId,
    productoIds
) {

    eliminarProductosStmt.run(
        ofertaId
    );


    for (
        const productoId
        of productoIds
    ) {

        insertarProductoStmt.run(
            ofertaId,
            productoId
        );

    }

}

function validarProductosCombo(
    productos
) {

    let unidadesTotales =
        0;


    for (
        const item
        of productos
    ) {

        if (
            !productoActivoStmt.get(
                item.productoId
            )
        ) {

            throw new Error(
                `El producto #${item.productoId} no existe o está desactivado.`
            );

        }


        unidadesTotales +=
            item.cantidad;

    }


    if (
        unidadesTotales < 2
    ) {

        throw new Error(
            "Un combo debe contener al menos 2 unidades de productos."
        );

    }

}


function guardarProductosCombo(
    comboId,
    productos
) {

    eliminarProductosComboStmt.run(
        comboId
    );


    for (
        const item
        of productos
    ) {

        insertarProductoComboStmt.run(

            comboId,

            item.productoId,

            item.cantidad

        );

    }

}

const crearTransaction =
    db.transaction(
        (datos) => {

            validarProductos(
                datos.productoIds
            );


            const ahora =
                new Date()
                    .toISOString();


            const oferta =
                crearStmt.get(

                    datos.nombre,
                    datos.tipo,
                    datos.valor,

                    datos.fechaDesde,
                    datos.fechaHasta,

                    ahora,
                    ahora

                );


            guardarProductos(
                oferta.id,
                datos.productoIds
            );


            return obtenerOferta(
                oferta.id
            );

        }
    );

const crearComboTransaction =
    db.transaction(
        (datos) => {

            validarProductosCombo(
                datos.productosCombo
            );


            const ahora =
                new Date()
                    .toISOString();


            const combo =
                crearComboStmt.get(

                    datos.nombre,
                    datos.valor,

                    datos.modoPrecio,
                    datos.valorRegla,
                    datos.alcanceDescuento,

                    datos.fechaDesde,
                    datos.fechaHasta,

                    ahora,
                    ahora

                );


            guardarProductosCombo(
                combo.id,
                datos.productosCombo
            );


            return obtenerOferta(
                combo.id,
                "COMBO"
            );

        }
    );


const actualizarComboTransaction =
    db.transaction(
        (datos) => {

            if (
                !comboStmt.get(
                    datos.id
                )
            ) {

                throw new Error(
                    "El combo no existe."
                );

            }


            validarProductosCombo(
                datos.productosCombo
            );


            const resultado =
                actualizarComboStmt.get(

                    datos.nombre,
                    datos.valor,

                    datos.modoPrecio,
                    datos.valorRegla,
                    datos.alcanceDescuento,

                    datos.fechaDesde,
                    datos.fechaHasta,

                    new Date()
                        .toISOString(),

                    datos.id

                );


            if (!resultado) {

                throw new Error(
                    "No se pudo actualizar el combo."
                );

            }


            guardarProductosCombo(
                datos.id,
                datos.productosCombo
            );


            return obtenerOferta(
                datos.id,
                "COMBO"
            );

        }
    );

export function crearOferta(
    datos
) {

    if (
        datos.tipo ===
        "COMBO"
    ) {

        return crearComboTransaction(
            datos
        );

    }


    return crearTransaction(
        datos
    );

}


const actualizarTransaction =
    db.transaction(
        (datos) => {

            if (
                !ofertaStmt.get(
                    datos.id
                )
            ) {

                throw new Error(
                    "La oferta no existe."
                );

            }


            validarProductos(
                datos.productoIds
            );


            const resultado =
                actualizarStmt.get(

                    datos.nombre,
                    datos.tipo,
                    datos.valor,

                    datos.fechaDesde,
                    datos.fechaHasta,

                    new Date()
                        .toISOString(),

                    datos.id

                );


            if (!resultado) {

                throw new Error(
                    "No se pudo actualizar la oferta."
                );

            }


            guardarProductos(
                datos.id,
                datos.productoIds
            );


            return obtenerOferta(
                datos.id
            );

        }
    );


export function actualizarOferta(
    datos
) {

    if (
        datos.tipo ===
        "COMBO"
    ) {

        return actualizarComboTransaction(
            datos
        );

    }


    return actualizarTransaction(
        datos
    );

}


export function cambiarActivoOferta({
    id,
    activo,
    tipo
}) {

    if (
        tipo ===
        "COMBO"
    ) {

        const resultado =
            cambiarActivoComboStmt.get(

                activo
                    ? 1
                    : 0,

                new Date()
                    .toISOString(),

                id

            );


        if (!resultado) {

            throw new Error(
                "El combo no existe."
            );

        }


        return obtenerOferta(
            id,
            "COMBO"
        );

    }


    const resultado =
        cambiarActivoStmt.get(

            activo
                ? 1
                : 0,

            new Date()
                .toISOString(),

            id

        );


    if (!resultado) {

        throw new Error(
            "La oferta no existe."
        );

    }


    return obtenerOferta(
        id
    );

}