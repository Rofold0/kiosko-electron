import {
    ipcMain
} from "electron";

import {
    obtenerDeviceId,
    formatearDeviceId
} from "../security/licensing/deviceId.js";


export function registerLicenciaHandlers() {

    /*
     * Este canal es intencionalmente público.
     *
     * Tiene que poder consultarse antes
     * de iniciar sesión porque luego
     * tendremos una pantalla de activación.
     *
     * Nunca devuelve el MachineGuid real.
     */

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

}