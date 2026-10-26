import {
    app
} from "electron";

import {
    verify
} from "node:crypto";

import fs
    from "node:fs";

import path
    from "node:path";

import {
    fileURLToPath
} from "node:url";

import {
    obtenerDeviceId
} from "./deviceId.js";


const __filename =
    fileURLToPath(
        import.meta.url
    );

const __dirname =
    path.dirname(
        __filename
    );


const PRODUCTO =
    "com.vicio.cuaderno";

const VERSION_LICENCIA =
    1;


let publicKeyCache =
    null;


const publicKeyPath =
    path.join(
        __dirname,
        "public-key.pem"
    );


export function obtenerRutaLicencia() {

    return path.join(
        app.getPath(
            "userData"
        ),
        "license",
        "license.json"
    );

}


function normalizarDeviceId(
    valor
) {

    return String(
        valor || ""
    )
        .replace(
            /[^a-fA-F0-9]/g,
            ""
        )
        .toUpperCase();

}


function extraerPayload(
    licencia
) {

    return {

        schema:
            licencia.schema,

        product:
            licencia.product,

        license_id:
            licencia.license_id,

        device_id:
            normalizarDeviceId(
                licencia.device_id
            ),

        cliente:
            licencia.cliente,

        tipo:
            licencia.tipo,

        emitida:
            licencia.emitida

    };

}


function serializarPayload(
    payload
) {

    return JSON.stringify({

        schema:
            payload.schema,

        product:
            payload.product,

        license_id:
            payload.license_id,

        device_id:
            payload.device_id,

        cliente:
            payload.cliente,

        tipo:
            payload.tipo,

        emitida:
            payload.emitida

    });

}


function leerPublicKey() {

    if (
        publicKeyCache
    ) {

        return publicKeyCache;

    }


    if (
        !fs.existsSync(
            publicKeyPath
        )
    ) {

        throw new Error(
            "No se encontró la llave pública de licencias."
        );

    }


    publicKeyCache =
        fs.readFileSync(
            publicKeyPath,
            "utf8"
        );


    return publicKeyCache;

}


function validarPayload(
    payload
) {

    if (
        payload.schema !==
        VERSION_LICENCIA
    ) {

        throw new Error(
            "Versión de licencia no compatible."
        );

    }


    if (
        payload.product !==
        PRODUCTO
    ) {

        throw new Error(
            "La licencia pertenece a otro producto."
        );

    }


    if (
        typeof payload.license_id !==
        "string" ||
        payload.license_id.length <
        10
    ) {

        throw new Error(
            "Identificador de licencia inválido."
        );

    }


    if (
        !/^[A-F0-9]{32}$/.test(
            payload.device_id
        )
    ) {

        throw new Error(
            "Identificador de equipo inválido."
        );

    }


    if (
        typeof payload.cliente !==
        "string" ||
        payload.cliente.trim().length <
        2
    ) {

        throw new Error(
            "Cliente de licencia inválido."
        );

    }


    if (
        payload.tipo !==
        "PERMANENTE"
    ) {

        throw new Error(
            "Tipo de licencia no compatible."
        );

    }


    if (
        typeof payload.emitida !==
        "string" ||
        Number.isNaN(
            Date.parse(
                payload.emitida
            )
        )
    ) {

        throw new Error(
            "Fecha de licencia inválida."
        );

    }

}


export function verificarLicenciaDocumento(
    licencia
) {

    if (
        !licencia ||
        typeof licencia !==
        "object"
    ) {

        throw new Error(
            "Archivo de licencia inválido."
        );

    }


    if (
        typeof licencia.firma !==
        "string" ||
        !licencia.firma
    ) {

        throw new Error(
            "La licencia no contiene una firma."
        );

    }


    const payload =
        extraerPayload(
            licencia
        );


    validarPayload(
        payload
    );


    const firmaValida =
        verify(
            null,

            Buffer.from(
                serializarPayload(
                    payload
                ),
                "utf8"
            ),

            leerPublicKey(),

            Buffer.from(
                licencia.firma,
                "base64"
            )
        );


    if (
        !firmaValida
    ) {

        throw new Error(
            "La firma de la licencia no es válida."
        );

    }


    const deviceIdActual =
        obtenerDeviceId();


    if (
        payload.device_id !==
        deviceIdActual
    ) {

        throw new Error(
            "La licencia pertenece a otro equipo."
        );

    }


    return {

        valida:
            true,

        licencia_id:
            payload.license_id,

        cliente:
            payload.cliente,

        tipo:
            payload.tipo,

        emitida:
            payload.emitida,

        device_id:
            payload.device_id

    };

}


export function instalarLicenciaDesdeRuta(
    rutaOrigen
) {

    const contenido =
        fs.readFileSync(
            rutaOrigen,
            "utf8"
        );


    let licencia;


    try {

        licencia =
            JSON.parse(
                contenido
            );


    } catch {

        throw new Error(
            "El archivo seleccionado no es una licencia válida."
        );

    }


    const estado =
        verificarLicenciaDocumento(
            licencia
        );


    const payload =
        extraerPayload(
            licencia
        );


    const licenciaNormalizada = {

        ...payload,

        firma:
            licencia.firma

    };


    const rutaDestino =
        obtenerRutaLicencia();


    fs.mkdirSync(
        path.dirname(
            rutaDestino
        ),
        {
            recursive:
                true
        }
    );


    fs.writeFileSync(
        rutaDestino,
        JSON.stringify(
            licenciaNormalizada,
            null,
            4
        ),
        "utf8"
    );


    return estado;

}


export function obtenerEstadoLicencia() {

    const ruta =
        obtenerRutaLicencia();


    if (
        !fs.existsSync(
            ruta
        )
    ) {

        return {

            valida:
                false,

            motivo:
                "SIN_LICENCIA",

            device_id:
                obtenerDeviceId()

        };

    }


    try {

        const contenido =
            fs.readFileSync(
                ruta,
                "utf8"
            );


        const licencia =
            JSON.parse(
                contenido
            );


        return verificarLicenciaDocumento(
            licencia
        );


    } catch (error) {

        return {

            valida:
                false,

            motivo:
                "LICENCIA_INVALIDA",

            error:
                error?.message ||
                String(error),

            device_id:
                obtenerDeviceId()

        };

    }

}


export function exigirLicenciaValida() {

    const estado =
        obtenerEstadoLicencia();


    if (
        !estado.valida
    ) {

        throw new Error(
            "Cuaderno de Vicios no está activado para este equipo."
        );

    }


    return estado;

}