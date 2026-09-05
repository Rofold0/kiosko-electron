import { Menu } from "electron";
import { ROUTES } from "../../shared/routes.js";

export function createMenu(mainWindow) {

    function navigateTo(route) {

        if (
            !mainWindow ||
            mainWindow.isDestroyed()
        ) {
            return;
        }

        mainWindow.webContents.send(
            "navigate",
            route
        );
    }

    const template = [
        {
            label: "Archivo",
            submenu: [
                {
                    label: "Salir",
                    role: "quit"
                }
            ]
        },

        {
            label: "Gestión",
            submenu: [
                {
                    label: "Dashboard",

                    click() {
                        navigateTo(
                            ROUTES.dashboard
                        );
                    }
                },

                {
                    label: "Categorías",

                    click() {
                        navigateTo(
                            ROUTES.categorias
                        );
                    }
                },

                {
                    label: "Subcategorías",

                    click() {
                        navigateTo(
                            ROUTES.subcategorias
                        );
                    }
                },
                {
                    label: "Productos",

                    click() {
                        navigateTo(
                            ROUTES.productos
                        );
                    }
                },
                {
                    label: "Stock",

                    click() {

                        navigateTo(
                            ROUTES.stock
                        );

                    }
                },
            ]
        }
    ];

    const menu =
        Menu.buildFromTemplate(template);

    Menu.setApplicationMenu(menu);
}