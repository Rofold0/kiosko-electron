import {
    app,
    BrowserWindow,
    dialog
} from "electron";

import path
    from "node:path";

import {
    handleProtegido
} from "../security/ipcPermissions.js";

import {
    auditar
} from "../security/audit.js";

import {
    crearBackupEn,
    nombreBackupManual,
    obtenerEstadoBackups,
    restaurarBackupDesde,
    validarBackup
} from "../database/backup.js";


export function registerBackupHandlers() {

    handleProtegido(
        "backup:estado",

        () =>
            obtenerEstadoBackups()
    );


    handleProtegido(
        "backup:crear",

        async (event) => {

            const ventana =
                BrowserWindow.fromWebContents(
                    event.sender
                );


            const resultado =
                await dialog.showSaveDialog(
                    ventana,
                    {
                        title:
                            "Guardar copia de seguridad",

                        defaultPath:
                            path.join(
                                app.getPath(
                                    "documents"
                                ),
                                nombreBackupManual()
                            ),

                        filters: [
                            {
                                name:
                                    "Base de datos SQLite",

                                extensions: [
                                    "db"
                                ]
                            }
                        ]
                    }
                );


            if (
                resultado.canceled ||
                !resultado.filePath
            ) {

                return {
                    cancelado: true
                };

            }


            const backup =
                await crearBackupEn(
                    resultado.filePath
                );


            auditar(
                event,
                {
                    modulo:
                        "SISTEMA",

                    accion:
                        "BACKUP_CREAR",

                    entidad:
                        "backup",

                    descripcion:
                        `Copia de seguridad creada: ${backup.nombre}`
                }
            );


            await dialog.showMessageBox(
                ventana,
                {
                    type:
                        "info",

                    title:
                        "Copia de seguridad",

                    message:
                        "La copia de seguridad se creó correctamente.",

                    detail:
                        backup.ruta,

                    buttons: [
                        "Aceptar"
                    ]
                }
            );


            return {

                cancelado: false,

                ...backup

            };

        }
    );


    handleProtegido(
        "backup:restaurar",

        async (event) => {

            const ventana =
                BrowserWindow.fromWebContents(
                    event.sender
                );


            const seleccion =
                await dialog.showOpenDialog(
                    ventana,
                    {
                        title:
                            "Restaurar copia de seguridad",

                        properties: [
                            "openFile"
                        ],

                        filters: [
                            {
                                name:
                                    "Base de datos SQLite",

                                extensions: [
                                    "db"
                                ]
                            }
                        ]
                    }
                );


            if (
                seleccion.canceled ||
                seleccion.filePaths.length === 0
            ) {

                return {
                    cancelado: true
                };

            }


            const origen =
                seleccion.filePaths[0];


            const informacion =
                validarBackup(
                    origen
                );


            const confirmacion =
                await dialog.showMessageBox(
                    ventana,
                    {
                        type:
                            "warning",

                        title:
                            "Restaurar copia",

                        message:
                            "¿Restaurar esta copia de seguridad?",

                        detail:
                            "Los datos actuales serán reemplazados. Antes de hacerlo se creará automáticamente una copia de seguridad del estado actual.",

                        buttons: [
                            "Cancelar",
                            "Restaurar"
                        ],

                        defaultId:
                            0,

                        cancelId:
                            0,

                        noLink:
                            true
                    }
                );


            if (
                confirmacion.response !==
                1
            ) {

                return {
                    cancelado: true
                };

            }


            /*
             * Este registro quedará también
             * dentro del backup pre-restore.
             */

            auditar(
                event,
                {
                    modulo:
                        "SISTEMA",

                    accion:
                        "BACKUP_RESTAURAR",

                    entidad:
                        "backup",

                    descripcion:
                        `Restauración solicitada desde ${informacion.nombre}`,

                    detalles: {
                        version:
                            informacion.version
                    }
                }
            );


            let restauracionIniciada =
                false;


            try {

                restauracionIniciada =
                    true;


                const resultado =
                    await restaurarBackupDesde(
                        origen
                    );


                await dialog.showMessageBox(
                    ventana,
                    {
                        type:
                            "info",

                        title:
                            "Restauración completada",

                        message:
                            "La copia de seguridad fue restaurada correctamente.",

                        detail:
                            "La aplicación se reiniciará para aplicar los cambios.",

                        buttons: [
                            "Reiniciar"
                        ]
                    }
                );


                return {

                    cancelado: false,

                    restaurado: true,

                    resultado

                };


            } catch (error) {

                await dialog.showMessageBox(
                    ventana,
                    {
                        type:
                            "error",

                        title:
                            "Error restaurando",

                        message:
                            "No se pudo completar la restauración.",

                        detail:
                            error?.message ||
                            String(
                                error
                            ),

                        buttons: [
                            "Aceptar"
                        ]
                    }
                );


                return {

                    cancelado: false,

                    restaurado: false,

                    error:
                        error?.message

                };


            } finally {

                /*
                 * restaurarBackupDesde puede
                 * cerrar la conexión SQLite.
                 * Tanto si sale bien como si
                 * falla después de ese punto,
                 * reiniciamos Electron.
                 */

                if (
                    restauracionIniciada
                ) {

                    setTimeout(
                        () => {

                            app.relaunch();

                            app.exit(
                                0
                            );

                        },
                        150
                    );

                }

            }

        }
    );

}