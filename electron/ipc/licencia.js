import {
    ipcMain
} from "electron";

import {
    obtenerDeviceId,
    formatearDeviceId
} from "../security/licensing/deviceId.js";

import {
    obtenerEstadoLicencia
} from "../security/licensing/license.js";


export function registerLicenciaHandlers() {

    ipcMain.handle(
        "licencia:equipo",

        () => {

            const deviceId =
                obtenerDeviceId();


            return {

                device_id:
                    deviceId,

                codigo_equipo:
                    formatearDeviceId(
                        deviceId
                    )

            };

        }
    );


    ipcMain.handle(
        "licencia:estado",

        () => {

            const estado =
                obtenerEstadoLicencia();


            return {

                ...estado,

                codigo_equipo:
                    formatearDeviceId(
                        estado.device_id
                    )

            };

        }
    );

}