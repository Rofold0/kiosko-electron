import {
    execFileSync
} from "node:child_process";

import {
    createHash
} from "node:crypto";


const DEVICE_NAMESPACE =
    "com.vicio.cuaderno|device|v1";


function obtenerMachineGuidWindows() {

    if (
        process.platform !==
        "win32"
    ) {

        throw new Error(
            "La identificación de equipo sólo está disponible en Windows."
        );

    }


    let salida;


    try {

        salida =
            execFileSync(
                "reg.exe",
                [
                    "query",
                    "HKLM\\SOFTWARE\\Microsoft\\Cryptography",
                    "/v",
                    "MachineGuid"
                ],
                {
                    encoding:
                        "utf8",

                    windowsHide:
                        true
                }
            );


    } catch {

        throw new Error(
            "No se pudo obtener la identificación de Windows."
        );

    }


    const coincidencia =
        salida.match(
            /MachineGuid\s+REG_SZ\s+([^\r\n]+)/i
        );


    if (
        !coincidencia?.[1]
    ) {

        throw new Error(
            "Windows no devolvió un identificador de equipo válido."
        );

    }


    return coincidencia[1]
        .trim()
        .toLowerCase();

}


export function obtenerDeviceId() {

    const machineGuid =
        obtenerMachineGuidWindows();


    /*
     * Nunca exponemos directamente
     * el MachineGuid de Windows.
     *
     * Lo convertimos a un identificador
     * propio de Cuaderno de Vicios.
     */
    const hash =
        createHash(
            "sha256"
        )
            .update(
                `${DEVICE_NAMESPACE}|${machineGuid}`,
                "utf8"
            )
            .digest(
                "hex"
            )
            .toUpperCase();


    /*
     * 128 bits son más que suficientes
     * para identificar una instalación.
     */
    return hash.slice(
        0,
        32
    );

}


export function formatearDeviceId(
    deviceId = obtenerDeviceId()
) {

    return deviceId
        .match(
            /.{1,4}/g
        )
        .join(
            "-"
        );

}