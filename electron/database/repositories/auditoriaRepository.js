import db
    from "../database.js";


const insertarAuditoriaStmt =
    db.prepare(`
        INSERT INTO auditoria (
            fecha,

            usuario_id,
            usuario,
            usuario_nombre,

            modulo,
            accion,

            entidad,
            entidad_id,

            descripcion,
            detalles_json
        )

        VALUES (
            ?, ?, ?, ?,
            ?, ?,
            ?, ?,
            ?, ?
        )
    `);


const listarAuditoriaStmt =
    db.prepare(`
        SELECT
            a.id,
            a.fecha,

            a.usuario_id,
            a.usuario,
            a.usuario_nombre,

            a.modulo,
            a.accion,

            a.entidad,
            a.entidad_id,

            a.descripcion,
            a.detalles_json

        FROM auditoria a

        WHERE
            (
                @modulo IS NULL
                OR
                a.modulo =
                    @modulo
            )

            AND (
                @usuarioId IS NULL
                OR
                a.usuario_id =
                    @usuarioId
            )

            AND (
                @desde IS NULL
                OR
                a.fecha >=
                    @desde
            )

            AND (
                @hasta IS NULL
                OR
                a.fecha <
                    @hasta
            )

        ORDER BY
            a.fecha DESC,
            a.id DESC

        LIMIT @limite
        OFFSET @offset
    `);


const contarAuditoriaStmt =
    db.prepare(`
        SELECT
            COUNT(*) AS total

        FROM auditoria a

        WHERE
            (
                @modulo IS NULL
                OR
                a.modulo =
                    @modulo
            )

            AND (
                @usuarioId IS NULL
                OR
                a.usuario_id =
                    @usuarioId
            )

            AND (
                @desde IS NULL
                OR
                a.fecha >=
                    @desde
            )

            AND (
                @hasta IS NULL
                OR
                a.fecha <
                    @hasta
            )
    `);


function parsearDetalles(
    valor
) {

    if (!valor) {
        return null;
    }


    try {

        return JSON.parse(
            valor
        );


    } catch {

        return null;

    }

}


export function registrarAuditoria({
    usuarioId,
    usuario,
    usuarioNombre,

    modulo,
    accion,

    entidad = null,
    entidadId = null,

    descripcion = null,
    detalles = null
}) {

    insertarAuditoriaStmt.run(

        new Date()
            .toISOString(),

        usuarioId ?? null,

        usuario || null,

        usuarioNombre || null,

        modulo,

        accion,

        entidad,

        entidadId ?? null,

        descripcion,

        detalles
            ? JSON.stringify(
                detalles
            )
            : null

    );

}


export function listarAuditoria({
    modulo = null,
    usuarioId = null,

    desde = null,
    hasta = null,

    limite = 50,
    offset = 0
}) {

    const parametros = {

        modulo,
        usuarioId,

        desde,
        hasta,

        limite,
        offset

    };


    const items =
        listarAuditoriaStmt
            .all(
                parametros
            )
            .map(
                (item) => ({

                    ...item,

                    detalles:
                        parsearDetalles(
                            item.detalles_json
                        )

                })
            );


    const total =
        contarAuditoriaStmt
            .get(
                parametros
            )
            .total;


    return {
        items,
        total
    };

}