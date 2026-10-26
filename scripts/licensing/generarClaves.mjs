import {
    generateKeyPairSync
} from "node:crypto";

import fs
    from "node:fs";

import path
    from "node:path";

import os
    from "node:os";


const directorioPrivado =
    path.join(
        os.homedir(),
        "Documents",
        "CuadernoVicios-Licencias"
    );


const directorioPublico =
    path.resolve(
        "electron",
        "security",
        "licensing"
    );


const rutaPrivada =
    path.join(
        directorioPrivado,
        "private-key.pem"
    );


const rutaPublicaBackup =
    path.join(
        directorioPrivado,
        "public-key.pem"
    );


const rutaPublicaApp =
    path.join(
        directorioPublico,
        "public-key.pem"
    );


fs.mkdirSync(
    directorioPrivado,
    {
        recursive: true
    }
);


fs.mkdirSync(
    directorioPublico,
    {
        recursive: true
    }
);


/*
 * Evitamos pisar accidentalmente
 * una llave privada ya existente.
 */
if (
    fs.existsSync(
        rutaPrivada
    )
) {

    console.error(
        "Ya existe una llave privada."
    );

    console.error(
        rutaPrivada
    );

    console.error(
        "No se generaron nuevas llaves."
    );

    process.exit(
        1
    );

}


const {
    publicKey,
    privateKey
} =
    generateKeyPairSync(
        "ed25519",
        {

            publicKeyEncoding: {

                type:
                    "spki",

                format:
                    "pem"

            },

            privateKeyEncoding: {

                type:
                    "pkcs8",

                format:
                    "pem"

            }

        }
    );


fs.writeFileSync(
    rutaPrivada,
    privateKey,
    {
        encoding:
            "utf8",

        mode:
            0o600
    }
);


fs.writeFileSync(
    rutaPublicaBackup,
    publicKey,
    "utf8"
);


fs.writeFileSync(
    rutaPublicaApp,
    publicKey,
    "utf8"
);


console.log(
    ""
);

console.log(
    "Llaves creadas correctamente."
);

console.log(
    ""
);

console.log(
    "PRIVADA:"
);

console.log(
    rutaPrivada
);

console.log(
    ""
);

console.log(
    "PÚBLICA:"
);

console.log(
    rutaPublicaApp
);

console.log(
    ""
);

console.log(
    "IMPORTANTE: nunca subir private-key.pem a GitHub."
);