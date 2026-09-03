import {
    BrowserWindow,
    dialog,
    ipcMain
} from "electron";


export function registerDialogosHandlers() {

    ipcMain.handle(
        "dialogos:confirmar",
        async (event, mensaje) => {

            const ventana =
                BrowserWindow.fromWebContents(
                    event.sender
                );


            const resultado =
                await dialog.showMessageBox(
                    ventana,
                    {
                        type: "question",

                        buttons: [
                            "Cancelar",
                            "Aceptar"
                        ],

                        defaultId: 1,
                        cancelId: 0,

                        noLink: true,

                        title: "Confirmar",

                        message: mensaje
                    }
                );


            return resultado.response === 1;

        }
    );


    ipcMain.handle(
        "dialogos:error",
        async (event, mensaje) => {

            const ventana =
                BrowserWindow.fromWebContents(
                    event.sender
                );


            await dialog.showMessageBox(
                ventana,
                {
                    type: "error",

                    buttons: [
                        "Aceptar"
                    ],

                    defaultId: 0,

                    title: "Error",

                    message: mensaje
                }
            );


            return true;

        }
    );

}