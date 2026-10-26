import {
    randomUUID,
    sign,
    verify
} from "node:crypto";

import fs
    from "node:fs";

import os
    from "node:os";

import path
    from "node:path";


const PRODUCTO =
    "com.vicio.cuaderno";

const VERSION_LICENCIA =
    1;


const directorioPrivado =
    path.join(
        os.homedir(),
        "Documents",
        "CuadernoVicios-Licencias"
    );


const rutaPrivada =
    path.join(
        directorioPrivado,
        "private-key.pem"
    );


const rutaPublica =
    path.resolve(
        "electron",
        "security",
        "licensing",
        "public-key.pem"
    );


const directorioSalida =
    path.join(
        directorioPrivado,
        "emitidas"
    );


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


function serializarPayload(
    payload
) {

    /*
     * IMPORTANTE:
     * mantener siempre este mismo orden.
     */
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


const [
    codigoEquipo,
    clienteArgumento
] =
    process.argv.slice(
        2
    );


const deviceId =
    normalizarDeviceId(
        codigoEquipo
    );


const cliente =
    String(
        clienteArgumento ||
        ""
    ).trim();


if (
    !/^[A-F0-9]{32}$/.test(
        deviceId
    )
) {

    console.error(
        "Código de equipo inválido."
    );

    console.error(
        "Ejemplo:"
    );

    console.error(
        "AAAA-BBBB-CCCC-DDDD-EEEE-FFFF-1111-2222"
    );

    process.exit(
        1
    );

}


if (
    cliente.length <
    2
) {

    console.error(
        "Debe indicar el nombre del cliente."
    );

    process.exit(
        1
    );

}


if (
    !fs.existsSync(
        rutaPrivada
    )
) {

    console.error(
        "No se encontró la llave privada:"
    );

    console.error(
        rutaPrivada
    );

    process.exit(
        1
    );

}


if (
    !fs.existsSync(
        rutaPublica
    )
) {

    console.error(
        "No se encontró la llave pública:"
    );

    console.error(
        rutaPublica
    );

    process.exit(
        1
    );

}


const privateKey =
    fs.readFileSync(
        rutaPrivada,
        "utf8"
    );


const publicKey =
    fs.readFileSync(
        rutaPublica,
        "utf8"
    );


const payload = {

    schema:
        VERSION_LICENCIA,

    product:
        PRODUCTO,

    license_id:
        randomUUID(),

    device_id:
        deviceId,

    cliente,

    tipo:
        "PERMANENTE",

    emitida:
        new Date()
            .toISOString()

};


const datosFirmados =
    Buffer.from(
        serializarPayload(
            payload
        ),
        "utf8"
    );


const firma =
    sign(
        null,
        datosFirmados,
        privateKey
    )
        .toString(
            "base64"
        );


/*
 * Verificación inmediata.
 *
 * Si la pública no corresponde con
 * la privada, no emitimos licencia.
 */
const firmaCorrecta =
    verify(
        null,
        datosFirmados,
        publicKey,
        Buffer.from(
            firma,
            "base64"
        )
    );


if (
    !firmaCorrecta
) {

    throw new Error(
        "La llave pública no corresponde con la llave privada."
    );

}


const licencia = {

    ...payload,

    firma

};


fs.mkdirSync(
    directorioSalida,
    {
        recursive: true
    }
);


const nombreArchivo =
    `license-${deviceId.slice(
        0,
        8
    )}-${payload.license_id.slice(
        0,
        8
    )}.json`;


const rutaSalida =
    path.join(
        directorioSalida,
        nombreArchivo
    );


fs.writeFileSync(
    rutaSalida,
    JSON.stringify(
        licencia,
        null,
        4
    ),
    "utf8"
);


console.log(
    ""
);

console.log(
    "Licencia creada correctamente."
);

console.log(
    ""
);

console.log(
    `Cliente: ${cliente}`
);

console.log(
    `Equipo: ${deviceId}`
);

console.log(
    `Licencia: ${payload.license_id}`
);

console.log(
    ""
);

console.log(
    rutaSalida
);