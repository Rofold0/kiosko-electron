import {
    randomBytes,
    scrypt,
    timingSafeEqual
} from "node:crypto";

import {
    promisify
} from "node:util";


const scryptAsync =
    promisify(
        scrypt
    );


const KEY_LENGTH =
    64;


const OPTIONS = {

    N:
        16384,

    r:
        8,

    p:
        1,

    maxmem:
        64 * 1024 * 1024

};


export async function crearPassword(
    password
) {

    const salt =
        randomBytes(16);


    const hash =
        await scryptAsync(

            password,

            salt,

            KEY_LENGTH,

            OPTIONS

        );


    return {

        hash:
            Buffer
                .from(hash)
                .toString(
                    "base64"
                ),

        salt:
            salt.toString(
                "base64"
            )

    };

}


export async function verificarPassword(
    password,
    saltBase64,
    hashBase64
) {

    const salt =
        Buffer.from(
            saltBase64,
            "base64"
        );


    const hashGuardado =
        Buffer.from(
            hashBase64,
            "base64"
        );


    const hashIngresado =
        await scryptAsync(

            password,

            salt,

            hashGuardado.length,

            OPTIONS

        );


    const hashBuffer =
        Buffer.from(
            hashIngresado
        );


    if (
        hashBuffer.length !==
        hashGuardado.length
    ) {

        return false;

    }


    return timingSafeEqual(
        hashBuffer,
        hashGuardado
    );

}