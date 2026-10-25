import {
  app,
  BrowserWindow
} from "electron";

import path from "node:path";

import { fileURLToPath } from "node:url";

import {
  registerIpcHandlers
} from "./ipc/index.js";

import {
  clearMenu
} from "./menu/applicationMenu.js";


const __filename =
  fileURLToPath(import.meta.url);

const __dirname =
  path.dirname(__filename);

let mainWindow = null;


function createWindow() {

  const preloadPath =
    path.join(
      __dirname,
      "preload.cjs"
    );

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 700,
    minHeight: 500,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false
    }
  });


  if (app.isPackaged) {

    mainWindow.loadFile(
      path.join(
        __dirname,
        "../dist/index.html"
      )
    );

  } else {

    mainWindow.loadURL(
      "http://localhost:5173"
    );

  }


  clearMenu();


  mainWindow.on("closed", () => {
    mainWindow = null;
  });


  if (!app.isPackaged) {
    mainWindow.webContents.openDevTools();
  }
}

const tieneBloqueo =
    app.requestSingleInstanceLock();


if (!tieneBloqueo) {

    app.quit();

} else {

    app.on(
        "second-instance",
        () => {

            if (!mainWindow) {
                return;
            }


            if (
                mainWindow.isMinimized()
            ) {

                mainWindow.restore();

            }


            mainWindow.show();
            mainWindow.focus();

        }
    );


    app.whenReady()
        .then(() => {

            registerIpcHandlers();

            createWindow();


            app.on(
                "activate",
                () => {

                    if (
                        BrowserWindow
                            .getAllWindows()
                            .length === 0
                    ) {

                        createWindow();

                    }

                }
            );

        });

}



app.on("window-all-closed", () => {

  if (process.platform !== "darwin") {
    app.quit();
  }

});