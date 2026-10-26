import {
    BrowserWindow,
    dialog,
    ipcMain
} from "electron";

import {
    obtenerDeviceId,
    formatearDeviceId
} from "../security/licensing/deviceId.js";

import {
    instalarLicenciaDesdeRuta,
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


    ipcMain.handle(
        "licencia:importar",

        async (event) => {

            const ventana =
                BrowserWindow
                    .fromWebContents(
                        event.sender
                    );


            const resultado =
                await dialog
                    .showOpenDialog(
                        ventana,
                        {

                            title:
                                "Importar licencia",

                            properties: [
                                "openFile"
                            ],

                            filters: [

                                {
                                    name:
                                        "Licencia Cuaderno de Vicios",

                                    extensions: [
                                        "json"
                                    ]
                                }

                            ]

                        }
                    );


            if (
                resultado.canceled ||
                resultado.filePaths.length ===
                0
            ) {

                return {

                    cancelada:
                        true

                };

            }


            try {

                const estado =
                    instalarLicenciaDesdeRuta(
                        resultado.filePaths[0]
                    );


                return {

                    cancelada:
                        false,

                    ...estado,

                    codigo_equipo:
                        formatearDeviceId(
                            estado.device_id
                        )

                };


            } catch (error) {

                const deviceId =
                    obtenerDeviceId();


                return {

                    cancelada:
                        false,

                    valida:
                        false,

                    motivo:
                        "IMPORTACION_INVALIDA",

                    error:
                        error?.message ||
                        String(error),

                    device_id:
                        deviceId,

                    codigo_equipo:
                        formatearDeviceId(
                            deviceId
                        )

                };

            }

        }
    );

}