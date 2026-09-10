import db
    from "../database.js";


const contarUsuariosStmt =
    db.prepare(`
        SELECT
            COUNT(*) AS total

        FROM usuarios
    `);


const usuarioLoginStmt =
    db.prepare(`
        SELECT
            u.id,
            u.usuario,
            u.nombre,

            u.password_hash,
            u.password_salt,

            u.rol_id,
            u.activo,

            r.clave
                AS rol_clave,

            r.nombre
                AS rol_nombre

        FROM usuarios u

        INNER JOIN roles r
            ON r.id =
                u.rol_id

        WHERE
            LOWER(u.usuario) =
            LOWER(?)

        LIMIT 1
    `);


const permisosUsuarioStmt =
    db.prepare(`
        SELECT
            p.clave

        FROM usuarios u

        INNER JOIN roles_permisos rp
            ON rp.rol_id =
                u.rol_id

        INNER JOIN permisos p
            ON p.id =
                rp.permiso_id

        WHERE
            u.id = ?

        ORDER BY
            p.clave ASC
    `);


const crearUsuarioStmt =
    db.prepare(`
        INSERT INTO usuarios (
            usuario,
            nombre,
            password_hash,
            password_salt,
            rol_id,
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


const actualizarAccesoStmt =
    db.prepare(`
        UPDATE usuarios

        SET ultimo_acceso = ?

        WHERE id = ?
    `);


const listarUsuariosStmt =
    db.prepare(`
        SELECT
            u.id,
            u.usuario,
            u.nombre,
            u.rol_id,
            u.activo,
            u.ultimo_acceso,
            u.creado_en,

            r.clave
                AS rol_clave,

            r.nombre
                AS rol_nombre

        FROM usuarios u

        INNER JOIN roles r
            ON r.id =
                u.rol_id

        ORDER BY
            u.activo DESC,
            u.nombre COLLATE NOCASE ASC
    `);


const usuarioPorIdStmt =
    db.prepare(`
        SELECT
            u.id,
            u.usuario,
            u.nombre,
            u.rol_id,
            u.activo,

            r.clave
                AS rol_clave,

            r.nombre
                AS rol_nombre

        FROM usuarios u

        INNER JOIN roles r
            ON r.id =
                u.rol_id

        WHERE u.id = ?
    `);


const actualizarUsuarioStmt =
    db.prepare(`
        UPDATE usuarios

        SET
            nombre = ?,
            rol_id = ?,
            actualizado_en = ?

        WHERE id = ?
    `);


const actualizarPasswordStmt =
    db.prepare(`
        UPDATE usuarios

        SET
            password_hash = ?,
            password_salt = ?,
            actualizado_en = ?

        WHERE id = ?
    `);


const cambiarActivoStmt =
    db.prepare(`
        UPDATE usuarios

        SET
            activo = ?,
            actualizado_en = ?

        WHERE id = ?
    `);


const rolActivoStmt =
    db.prepare(`
        SELECT
            id,
            clave,
            nombre,
            sistema

        FROM roles

        WHERE
            id = ?
            AND activo = 1
    `);


const contarAdministradoresStmt =
    db.prepare(`
        SELECT
            COUNT(*) AS total

        FROM usuarios u

        INNER JOIN roles r
            ON r.id =
                u.rol_id

        WHERE
            u.activo = 1
            AND r.clave = 'ADMIN'
    `);


const rolesStmt =
    db.prepare(`
        SELECT
            id,
            clave,
            nombre,
            descripcion,
            activo,
            sistema

        FROM roles

        WHERE activo = 1

        ORDER BY
            id ASC
    `);


const permisosStmt =
    db.prepare(`
        SELECT
            id,
            clave,
            descripcion

        FROM permisos

        ORDER BY
            clave ASC
    `);


const permisosRolStmt =
    db.prepare(`
        SELECT
            permiso_id

        FROM roles_permisos

        WHERE rol_id = ?
    `);


const borrarPermisosRolStmt =
    db.prepare(`
        DELETE FROM roles_permisos

        WHERE rol_id = ?
    `);


const insertarPermisoRolStmt =
    db.prepare(`
        INSERT INTO roles_permisos (
            rol_id,
            permiso_id
        )

        VALUES (?, ?)
    `);


export function hayUsuarios() {

    return (
        contarUsuariosStmt
            .get()
            .total > 0
    );

}


export function obtenerUsuarioLogin(
    usuario
) {

    return usuarioLoginStmt.get(
        usuario
    );

}


export function obtenerPermisosUsuario(
    usuarioId
) {

    return permisosUsuarioStmt
        .all(
            usuarioId
        )
        .map(
            (item) =>
                item.clave
        );

}


export function registrarAcceso(
    usuarioId
) {

    actualizarAccesoStmt.run(
        new Date()
            .toISOString(),

        usuarioId
    );

}


export function crearUsuarioDb({
    usuario,
    nombre,
    passwordHash,
    passwordSalt,
    rolId
}) {

    const ahora =
        new Date()
            .toISOString();


    const resultado =
        crearUsuarioStmt.get(

            usuario,
            nombre,

            passwordHash,
            passwordSalt,

            rolId,

            ahora,
            ahora

        );


    return usuarioPorIdStmt.get(
        resultado.id
    );

}


export function listarUsuarios() {

    return listarUsuariosStmt.all();

}


export function obtenerUsuario(
    id
) {

    return usuarioPorIdStmt.get(
        id
    );

}


export function obtenerRolActivo(
    id
) {

    return rolActivoStmt.get(
        id
    );

}


export function actualizarUsuario({
    id,
    nombre,
    rolId
}) {

    actualizarUsuarioStmt.run(

        nombre,
        rolId,

        new Date()
            .toISOString(),

        id

    );


    return obtenerUsuario(
        id
    );

}


export function actualizarPassword({
    id,
    hash,
    salt
}) {

    actualizarPasswordStmt.run(

        hash,
        salt,

        new Date()
            .toISOString(),

        id

    );

}


export function cambiarEstadoUsuario({
    id,
    activo
}) {

    const usuario =
        obtenerUsuario(
            id
        );


    if (!usuario) {

        throw new Error(
            "El usuario no existe."
        );

    }


    if (
        !activo &&
        usuario.rol_clave ===
            "ADMIN"
    ) {

        const administradores =
            contarAdministradoresStmt
                .get()
                .total;


        if (
            administradores <= 1
        ) {

            throw new Error(
                "No puede desactivar el último administrador."
            );

        }

    }


    cambiarActivoStmt.run(

        activo
            ? 1
            : 0,

        new Date()
            .toISOString(),

        id

    );


    return obtenerUsuario(
        id
    );

}


export function listarRoles() {

    return rolesStmt
        .all()
        .map(
            (rol) => ({

                ...rol,

                permisos:
                    permisosRolStmt
                        .all(
                            rol.id
                        )
                        .map(
                            (item) =>
                                item.permiso_id
                        )

            })
        );

}


export function listarPermisos() {

    return permisosStmt.all();

}


const actualizarPermisosTransaction =
    db.transaction(
        (
            rolId,
            permisoIds
        ) => {

            const rol =
                obtenerRolActivo(
                    rolId
                );


            if (!rol) {

                throw new Error(
                    "El rol no existe."
                );

            }


            if (
                rol.clave ===
                "ADMIN"
            ) {

                throw new Error(
                    "Los permisos del Administrador no pueden modificarse."
                );

            }


            borrarPermisosRolStmt.run(
                rolId
            );


            for (
                const permisoId
                of permisoIds
            ) {

                insertarPermisoRolStmt.run(
                    rolId,
                    permisoId
                );

            }

        }
    );


export function actualizarPermisosRol(
    rolId,
    permisoIds
) {

    actualizarPermisosTransaction(
        rolId,
        permisoIds
    );

}