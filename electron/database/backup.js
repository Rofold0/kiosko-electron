import Database
    from "better-sqlite3";

import {
    app
} from "electron";

import fs
    from "node:fs";

import path
    from "node:path";

import db, {
    dbDirectory,
    dbPath
} from "./database.js";

import {
    LATEST_SCHEMA_VERSION
} from "./migrations.js";


const RETENCION_AUTOMATICOS = 7;

const RETENCION_PRE_RESTORE = 5;


const backupDirectory =
    app.isPackaged

        ? path.join(
            app.getPath(
                "userData"
            ),
            "backups"
        )

        : path.join(
            dbDirectory,
            "backups"
        );


fs.mkdirSync(
    backupDirectory,
    {
        recursive: true
    }
);


function pad(valor) {

    return String(
        valor
    ).padStart(
        2,
        "0"
    );

}


function fechaLocal(
    fecha = new Date()
) {

    return [
        fecha.getFullYear(),
        pad(
            fecha.getMonth() + 1
        ),
        pad(
            fecha.getDate()
        )
    ].join("-");

}


function marcaTiempo(
    fecha = new Date()
) {

    return (
        `${fechaLocal(fecha)
        }_${pad(
            fecha.getHours()
        )}-${pad(
            fecha.getMinutes()
        )}-${pad(
            fecha.getSeconds()
        )}`
    );

}


export function nombreBackupManual() {

    return (
        `anotador-vicios-${marcaTiempo()}.db`
    );

}


function listarBackups(
    prefijo
) {

    if (
        !fs.existsSync(
            backupDirectory
        )
    ) {

        return [];

    }


    return fs
        .readdirSync(
            backupDirectory,
            {
                withFileTypes: true
            }
        )

        .filter(
            (entrada) =>
                entrada.isFile() &&
                entrada.name.startsWith(
                    prefijo
                ) &&
                entrada.name.endsWith(
                    ".db"
                )
        )

        .map(
            (entrada) => {

                const ruta =
                    path.join(
                        backupDirectory,
                        entrada.name
                    );


                const stat =
                    fs.statSync(
                        ruta
                    );


                return {

                    nombre:
                        entrada.name,

                    ruta,

                    tamano:
                        stat.size,

                    modificado:
                        stat.mtime.toISOString(),

                    mtimeMs:
                        stat.mtimeMs

                };

            }
        )

        .sort(
            (a, b) =>
                b.mtimeMs -
                a.mtimeMs
        );

}


function aplicarRetencion(
    prefijo,
    cantidad
) {

    const archivos =
        listarBackups(
            prefijo
        );


    for (
        const archivo
        of archivos.slice(
            cantidad
        )
    ) {

        try {

            fs.rmSync(
                archivo.ruta,
                {
                    force: true
                }
            );

        } catch (error) {

            console.error(
                "No se pudo eliminar backup antiguo:",
                error
            );

        }

    }

}


export function validarBackup(
    ruta
) {

    if (
        !ruta ||
        !fs.existsSync(
            ruta
        )
    ) {

        throw new Error(
            "El archivo de backup no existe."
        );

    }


    if (
        path.resolve(
            ruta
        ) ===
        path.resolve(
            dbPath
        )
    ) {

        throw new Error(
            "No se puede utilizar como backup la base de datos actualmente abierta."
        );

    }


    const stat =
        fs.statSync(
            ruta
        );


    if (
        !stat.isFile() ||
        stat.size === 0
    ) {

        throw new Error(
            "El archivo seleccionado no es un backup válido."
        );

    }


    let backupDb;


    try {

        backupDb =
            new Database(
                ruta,
                {
                    readonly: true,
                    fileMustExist: true
                }
            );


        const integridad =
            backupDb.pragma(
                "integrity_check",
                {
                    simple: true
                }
            );


        if (
            String(
                integridad
            ).toLowerCase() !==
            "ok"
        ) {

            throw new Error(
                "La copia de seguridad está dañada."
            );

        }


        const version =
            Number(
                backupDb.pragma(
                    "user_version",
                    {
                        simple: true
                    }
                ) ||
                0
            );


        if (
            version >
            LATEST_SCHEMA_VERSION
        ) {

            throw new Error(
                "La copia fue creada por una versión más nueva de la aplicación."
            );

        }


        const tablasNecesarias =
            [
                "usuarios",
                "roles",
                "productos"
            ];


        const tablas =
            backupDb.prepare(`
                SELECT name

                FROM sqlite_master

                WHERE
                    type = 'table'

                    AND name IN (
                        'usuarios',
                        'roles',
                        'productos'
                    )
            `).all();


        const nombres =
            new Set(
                tablas.map(
                    (tabla) =>
                        tabla.name
                )
            );


        for (
            const tabla
            of tablasNecesarias
        ) {

            if (
                !nombres.has(
                    tabla
                )
            ) {

                throw new Error(
                    "El archivo seleccionado no pertenece a una instalación válida de Anotador de Vicios."
                );

            }

        }


        return {

            valido: true,

            version,

            tamano:
                stat.size,

            nombre:
                path.basename(
                    ruta
                )

        };


    } finally {

        if (backupDb) {

            backupDb.close();

        }

    }

}


export async function crearBackupEn(
    destino
) {

    const ruta =
        path.resolve(
            destino
        );


    if (
        ruta ===
        path.resolve(
            dbPath
        )
    ) {

        throw new Error(
            "El backup no puede reemplazar la base de datos activa."
        );

    }


    fs.mkdirSync(
        path.dirname(
            ruta
        ),
        {
            recursive: true
        }
    );


    /*
     * showSaveDialog ya pregunta
     * antes de sobrescribir.
     */

    if (
        fs.existsSync(
            ruta
        )
    ) {

        fs.rmSync(
            ruta,
            {
                force: true
            }
        );

    }


    try {

        await db.backup(
            ruta
        );


        const validacion =
            validarBackup(
                ruta
            );


        return {

            ruta,

            nombre:
                path.basename(
                    ruta
                ),

            ...validacion

        };


    } catch (error) {

        try {

            fs.rmSync(
                ruta,
                {
                    force: true
                }
            );

        } catch {

            // No hacemos nada.

        }


        throw error;

    }

}


export async function crearBackupAutomaticoSiCorresponde() {

    const prefijoHoy =
        `auto-${fechaLocal()}_`;


    const automaticos =
        listarBackups(
            "auto-"
        );


    const yaExiste =
        automaticos.some(
            (archivo) =>
                archivo
                    .nombre
                    .startsWith(
                        prefijoHoy
                    )
        );


    if (
        yaExiste
    ) {

        aplicarRetencion(
            "auto-",
            RETENCION_AUTOMATICOS
        );


        return {

            creado: false,

            motivo:
                "YA_EXISTE_HOY"

        };

    }


    const destino =
        path.join(
            backupDirectory,
            `auto-${marcaTiempo()}.db`
        );


    const resultado =
        await crearBackupEn(
            destino
        );


    aplicarRetencion(
        "auto-",
        RETENCION_AUTOMATICOS
    );


    return {

        creado: true,

        ...resultado

    };

}


async function crearBackupPreRestore() {

    const destino =
        path.join(
            backupDirectory,
            `pre-restore-${marcaTiempo()}.db`
        );


    const resultado =
        await crearBackupEn(
            destino
        );


    aplicarRetencion(
        "pre-restore-",
        RETENCION_PRE_RESTORE
    );


    return resultado;

}


export function obtenerEstadoBackups() {

    const automaticos =
        listarBackups(
            "auto-"
        );


    const preRestore =
        listarBackups(
            "pre-restore-"
        );


    return {

        directorio:
            backupDirectory,

        retencionAutomatica:
            RETENCION_AUTOMATICOS,

        cantidadAutomaticos:
            automaticos.length,

        ultimoAutomatico:
            automaticos[0] ||
            null,

        cantidadPreRestore:
            preRestore.length

    };

}


export async function restaurarBackupDesde(
    origen
) {

    const validacion =
        validarBackup(
            origen
        );


    /*
     * Antes de tocar la base actual
     * hacemos una copia de seguridad.
     */

    const backupSeguridad =
        await crearBackupPreRestore();


    const staging =
        path.join(
            dbDirectory,
            `restore-${Date.now()}.tmp.db`
        );


    fs.copyFileSync(
        origen,
        staging
    );


    /*
     * Validamos también la copia
     * que realmente vamos a instalar.
     */

    validarBackup(
        staging
    );


    /*
     * Consolidamos WAL antes de
     * cerrar la conexión actual.
     */

    db.pragma(
        "wal_checkpoint(TRUNCATE)"
    );


    db.close();


    fs.rmSync(
        `${dbPath}-wal`,
        {
            force: true
        }
    );


    fs.rmSync(
        `${dbPath}-shm`,
        {
            force: true
        }
    );


    const baseAnterior =
        `${dbPath}.restore-old`;


    fs.rmSync(
        baseAnterior,
        {
            force: true
        }
    );


    let baseMovida = false;


    try {

        if (
            fs.existsSync(
                dbPath
            )
        ) {

            fs.renameSync(
                dbPath,
                baseAnterior
            );

            baseMovida = true;

        }


        /*
         * Rename dentro del mismo disco:
         * el cambio es mucho más seguro
         * que sobrescribir el archivo
         * directamente.
         */

        fs.renameSync(
            staging,
            dbPath
        );


    } catch (error) {

        /*
         * Intentamos volver inmediatamente
         * a la base anterior.
         */

        if (
            baseMovida &&
            fs.existsSync(
                baseAnterior
            )
        ) {

            fs.rmSync(
                dbPath,
                {
                    force: true
                }
            );


            fs.renameSync(
                baseAnterior,
                dbPath
            );

        }


        throw error;


    } finally {

        fs.rmSync(
            staging,
            {
                force: true
            }
        );

    }


    /*
     * La restauración salió bien.
     * Ya podemos borrar el archivo
     * temporal anterior porque tenemos
     * backupSeguridad.
     */

    fs.rmSync(
        baseAnterior,
        {
            force: true
        }
    );


    return {

        restaurado: true,

        origen:
            path.basename(
                origen
            ),

        version:
            validacion.version,

        backupSeguridad

    };

}