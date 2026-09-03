import { app, BrowserWindow, Menu } from 'electron'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { registerCategoriasHandlers } from './ipc/categorias.js'
import { existsSync } from "node:fs";
import { registerIpcHandlers } from "./ipc/index.js";
import { createMenu } from "./menu/aplicationMenu.js";

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

let mainWindow = null;

function createWindow() {
  const preloadPath = path.join(__dirname, "preload.cjs");

  console.log("Ruta preload:", preloadPath);
  console.log("¿Existe preload?:", existsSync(preloadPath));

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      preload:preloadPath,
      contextIsolation: true,
      nodeIntegration: false
    }
  });

 if (app.isPackaged) {
  mainWindow.loadFile();
} else {
  mainWindow.loadURL("http://localhost:5173");
}

mainWindow.webContents.on(
  "preload-error",
  (event, preloadPath, error) => {
    console.error("ERROR AL CARGAR PRELOAD");
    console.error("Archivo:", preloadPath);
    console.error(error);
  }
);
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
mainWindow.webContents.openDevTools();
  createMenu();
}



//Navegacion
function navigateTo(route) {
  if (!mainWindow || mainWindow.isDestroyed()) {
    return;
  }

  mainWindow.webContents.send("navigate", route);
}

//Electron
app.whenReady().then(() => {
  registerCategoriasHandlers();
  createWindow();

  app.on("window-all-closed", () => {

    if (process.platform !== "darwin") {
      app.quit();
    }

  });
  createMenu();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

