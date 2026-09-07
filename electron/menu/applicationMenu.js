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
            label: "Dashboard",

            click() {
                navigateTo(
                    ROUTES.dashboard
                );
            }

        },
        {
            label: "Administración",
            submenu: [
                {
                    label: "Categorías",

                    click() {
                        navigateTo(
                            ROUTES.categorias
                        );
                    }
                }, {
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
                {
                    label: "Lista de compras",

                    click() {

                        navigateTo(
                            ROUTES.listaCompras
                        );

                    }
                },
            ]
        },
        {
            label: "Gestión",
            submenu: [



                {
                    label: "Proveedores",

                    click() {

                        navigateTo(
                            ROUTES.proveedores
                        );

                    }
                },
                {
                    label: "Compras",

                    click() {

                        navigateTo(
                            ROUTES.compras
                        );

                    }
                },
                {
                    label: "Precios",

                    click() {

                        navigateTo(
                            ROUTES.precios
                        );

                    }
                },
                {
                    label: "Ventas",

                    click() {

                        navigateTo(
                            ROUTES.ventas
                        );

                    }
                },
                {
                    label: "Caja",

                    click() {

                        navigateTo(
                            ROUTES.caja
                        );

                    }
                },
                {
                    label: "Gastos",

                    click() {

                        navigateTo(
                            ROUTES.gastos
                        );

                    }
                },
            ]
        },
        {
            label: "Reportes",
            submenu: [
                {
                    label: "Reportes",

                    click() {

                        navigateTo(
                            ROUTES.reportes
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