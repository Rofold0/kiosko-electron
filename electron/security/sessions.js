const sesiones =
    new Map();


function sesionPublica(
    sesion
) {

    if (!sesion) {
        return null;
    }


    return {

        id:
            sesion.id,

        usuario:
            sesion.usuario,

        nombre:
            sesion.nombre,

        rol_id:
            sesion.rol_id,

        rol:
            sesion.rol,

        permisos:
            [
                ...sesion.permisos
            ]

    };

}


export function establecerSesion(
    event,
    usuario
) {

    const sesion = {

        id:
            usuario.id,

        usuario:
            usuario.usuario,

        nombre:
            usuario.nombre,

        rol_id:
            usuario.rol_id,

        rol:
            usuario.rol_nombre,

        permisos:
            new Set(
                usuario.permisos ||
                []
            )

    };


    sesiones.set(
        event.sender.id,
        sesion
    );


    return sesionPublica(
        sesion
    );

}


export function obtenerSesion(
    event
) {

    return sesionPublica(
        sesiones.get(
            event.sender.id
        )
    );

}


export function exigirSesion(
    event
) {

    const sesion =
        sesiones.get(
            event.sender.id
        );


    if (!sesion) {

        throw new Error(
            "Debe iniciar sesión."
        );

    }


    return sesion;

}


export function exigirPermiso(
    event,
    permiso
) {

    const sesion =
        exigirSesion(
            event
        );


    if (
        !sesion
            .permisos
            .has(
                permiso
            )
    ) {

        throw new Error(
            "No tiene permiso para realizar esta operación."
        );

    }


    return sesion;

}


export function cerrarSesion(
    event
) {

    sesiones.delete(
        event.sender.id
    );

}


export function invalidarUsuario(
    usuarioId
) {

    for (
        const [
            webContentsId,
            sesion
        ]
        of sesiones
    ) {

        if (
            sesion.id ===
            usuarioId
        ) {

            sesiones.delete(
                webContentsId
            );

        }

    }

}


export function invalidarRol(
    rolId
) {

    for (
        const [
            webContentsId,
            sesion
        ]
        of sesiones
    ) {

        if (
            sesion.rol_id ===
            rolId
        ) {

            sesiones.delete(
                webContentsId
            );

        }

    }

}