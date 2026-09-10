import {
    ipcMain
} from "electron";

import {
    crearPassword,
    verificarPassword
} from "../security/passwords.js";

import {
    establecerSesion,
    obtenerSesion,
    cerrarSesion,
    exigirPermiso,
    invalidarUsuario,
    invalidarRol
} from "../security/session.js";

import {
    hayUsuarios,
    obtenerUsuarioLogin,
    obtenerPermisosUsuario,
    registrarAcceso,

    crearUsuarioDb,
    listarUsuarios,
    obtenerUsuario,
    obtenerRolActivo,
    actualizarUsuario,
    actualizarPassword,
    cambiarEstadoUsuario,

    listarRoles,
    listarPermisos,
    actualizarPermisosRol
} from "../database/repositories/usuariosRepository.js";


const USUARIO_REGEX =
    /^[a-z0-9._-]{3,32}$/;


function normalizarUsuario(
    valor
) {

    const usuario =
        String(
            valor || ""
        )
            .trim()
            .toLowerCase();


    if (
        !USUARIO_REGEX.test(
            usuario
        )
    ) {

        throw new Error(
            "El usuario debe tener entre 3 y 32 caracteres y usar sólo letras, números, punto, guion o guion bajo."
        );

    }


    return usuario;

}


function validarNombre(
    valor
) {

    const nombre =
        String(
            valor || ""
        )
            .trim();


    if (
        nombre.length < 2 ||
        nombre.length > 80
    ) {

        throw new Error(
            "El nombre debe tener entre 2 y 80 caracteres."
        );

    }


    return nombre;

}


function validarPassword(
    valor
) {

    const password =
        String(
            valor || ""
        );


    if (
        password.length < 8 ||
        password.length > 128
    ) {

        throw new Error(
            "La contraseña debe tener entre 8 y 128 caracteres."
        );

    }


    return password;

}


function validarId(
    valor
) {

    const id =
        Number(valor);


    if (
        !Number.isInteger(id) ||
        id <= 0
    ) {

        throw new Error(
            "ID inválido."
        );

    }


    return id;

}


async function crearUsuarioInterno({
    usuario,
    nombre,
    password,
    rolId
}) {

    const rol =
        obtenerRolActivo(
            rolId
        );


    if (!rol) {

        throw new Error(
            "El rol seleccionado no existe."
        );

    }


    const passwordDatos =
        await crearPassword(
            password
        );


    try {

        return crearUsuarioDb({

            usuario,

            nombre,

            passwordHash:
                passwordDatos.hash,

            passwordSalt:
                passwordDatos.salt,

            rolId

        });


    } catch (error) {

        if (
            String(
                error?.code ||
                ""
            )
                .startsWith(
                    "SQLITE_CONSTRAINT"
                )
        ) {

            throw new Error(
                "Ese nombre de usuario ya existe."
            );

        }


        throw error;

    }

}


export function registerUsuariosHandlers() {

    /*
     * Estado inicial:
     * puede consultarse sin sesión.
     */

    ipcMain.handle(
        "auth:estado",
        (event) => ({

            requiere_configuracion:
                !hayUsuarios(),

            usuario:
                obtenerSesion(
                    event
                )

        })
    );


    /*
     * Primer administrador.
     * Sólo funciona si no existe
     * ningún usuario todavía.
     */

    ipcMain.handle(
        "auth:configurar-inicial",

        async (
            event,
            datos
        ) => {

            if (
                hayUsuarios()
            ) {

                throw new Error(
                    "La configuración inicial ya fue realizada."
                );

            }


            const admin =
                listarRoles()
                    .find(
                        (rol) =>
                            rol.clave ===
                            "ADMIN"
                    );


            if (!admin) {

                throw new Error(
                    "No se encontró el rol Administrador."
                );

            }


            const usuario =
                await crearUsuarioInterno({

                    usuario:
                        normalizarUsuario(
                            datos?.usuario
                        ),

                    nombre:
                        validarNombre(
                            datos?.nombre
                        ),

                    password:
                        validarPassword(
                            datos?.password
                        ),

                    rolId:
                        admin.id

                });


            const permisos =
                obtenerPermisosUsuario(
                    usuario.id
                );


            return establecerSesion(
                event,
                {
                    ...usuario,

                    permisos
                }
            );

        }
    );


    ipcMain.handle(
        "auth:login",

        async (
            event,
            datos
        ) => {

            const usuarioTexto =
                normalizarUsuario(
                    datos?.usuario
                );


            const password =
                validarPassword(
                    datos?.password
                );


            const usuario =
                obtenerUsuarioLogin(
                    usuarioTexto
                );


            if (
                !usuario ||
                !usuario.activo
            ) {

                throw new Error(
                    "Usuario o contraseña incorrectos."
                );

            }


            const correcto =
                await verificarPassword(

                    password,

                    usuario.password_salt,

                    usuario.password_hash

                );


            if (!correcto) {

                throw new Error(
                    "Usuario o contraseña incorrectos."
                );

            }


            const permisos =
                obtenerPermisosUsuario(
                    usuario.id
                );


            registrarAcceso(
                usuario.id
            );


            return establecerSesion(
                event,
                {
                    ...usuario,

                    permisos
                }
            );

        }
    );


    ipcMain.handle(
        "auth:logout",
        (event) => {

            cerrarSesion(
                event
            );


            return true;

        }
    );


    ipcMain.handle(
        "usuarios:listar",
        (event) => {

            exigirPermiso(
                event,
                "usuarios.ver"
            );


            return listarUsuarios();

        }
    );


    ipcMain.handle(
        "usuarios:roles",
        (event) => {

            exigirPermiso(
                event,
                "roles.ver"
            );


            return listarRoles();

        }
    );


    ipcMain.handle(
        "usuarios:permisos",
        (event) => {

            exigirPermiso(
                event,
                "roles.ver"
            );


            return listarPermisos();

        }
    );


    ipcMain.handle(
        "usuarios:crear",

        async (
            event,
            datos
        ) => {

            exigirPermiso(
                event,
                "usuarios.crear"
            );


            return crearUsuarioInterno({

                usuario:
                    normalizarUsuario(
                        datos?.usuario
                    ),

                nombre:
                    validarNombre(
                        datos?.nombre
                    ),

                password:
                    validarPassword(
                        datos?.password
                    ),

                rolId:
                    validarId(
                        datos?.rol_id
                    )

            });

        }
    );


    ipcMain.handle(
        "usuarios:actualizar",
        (
            event,
            datos
        ) => {

            exigirPermiso(
                event,
                "usuarios.modificar"
            );


            const id =
                validarId(
                    datos?.id
                );


            if (
                !obtenerUsuario(id)
            ) {

                throw new Error(
                    "El usuario no existe."
                );

            }


            const rolId =
                validarId(
                    datos?.rol_id
                );


            if (
                !obtenerRolActivo(
                    rolId
                )
            ) {

                throw new Error(
                    "El rol seleccionado no existe."
                );

            }


            const resultado =
                actualizarUsuario({

                    id,

                    nombre:
                        validarNombre(
                            datos?.nombre
                        ),

                    rolId

                });


            invalidarUsuario(
                id
            );


            return resultado;

        }
    );


    ipcMain.handle(
        "usuarios:cambiar-password",

        async (
            event,
            datos
        ) => {

            exigirPermiso(
                event,
                "usuarios.modificar"
            );


            const id =
                validarId(
                    datos?.id
                );


            if (
                !obtenerUsuario(id)
            ) {

                throw new Error(
                    "El usuario no existe."
                );

            }


            const password =
                validarPassword(
                    datos?.password
                );


            const passwordDatos =
                await crearPassword(
                    password
                );


            actualizarPassword({

                id,

                hash:
                    passwordDatos.hash,

                salt:
                    passwordDatos.salt

            });


            invalidarUsuario(
                id
            );


            return true;

        }
    );


    ipcMain.handle(
        "usuarios:cambiar-activo",
        (
            event,
            datos
        ) => {

            exigirPermiso(
                event,
                "usuarios.desactivar"
            );


            const id =
                validarId(
                    datos?.id
                );


            const resultado =
                cambiarEstadoUsuario({

                    id,

                    activo:
                        datos?.activo ===
                        true

                });


            invalidarUsuario(
                id
            );


            return resultado;

        }
    );


    ipcMain.handle(
        "roles:actualizar-permisos",
        (
            event,
            datos
        ) => {

            exigirPermiso(
                event,
                "roles.modificar"
            );


            const rolId =
                validarId(
                    datos?.rol_id
                );


            if (
                !Array.isArray(
                    datos?.permisos
                )
            ) {

                throw new Error(
                    "Permisos inválidos."
                );

            }


            const permisoIds =
                [
                    ...new Set(
                        datos.permisos
                            .map(
                                validarId
                            )
                    )
                ];


            const permisosValidos =
                new Set(
                    listarPermisos()
                        .map(
                            (item) =>
                                item.id
                        )
                );


            for (
                const permisoId
                of permisoIds
            ) {

                if (
                    !permisosValidos.has(
                        permisoId
                    )
                ) {

                    throw new Error(
                        "Uno de los permisos no existe."
                    );

                }

            }


            actualizarPermisosRol(
                rolId,
                permisoIds
            );


            invalidarRol(
                rolId
            );


            return true;

        }
    );

}