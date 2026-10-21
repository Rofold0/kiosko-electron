import {
    Menu
} from "electron";

import {
    ROUTES
} from "../../shared/routes.js";


export function clearMenu() {

    Menu.setApplicationMenu(
        null
    );

}


export function createMenu(
    mainWindow,
    sesion
) {

    if (
        !sesion
    ) {

        clearMenu();

        return;

    }


    const permisos =
        new Set(
            sesion.permisos ||
            []
        );


    const puede =
        (permiso) =>
            permisos.has(
                permiso
            );


    const puedeAlguno =
        (...lista) =>
            lista.some(
                puede
            );


    const navigateTo =
        (route) => {

            if (
                !mainWindow ||
                mainWindow.isDestroyed()
            ) {

                return;

            }


            mainWindow
                .webContents
                .send(
                    "navigate",
                    route
                );

        };


    const item =
        (
            label,
            route
        ) => ({

            label,

            click() {

                navigateTo(
                    route
                );

            }

        });


    const mercaderia = [];


    if (
        puede(
            "categorias.ver"
        )
    ) {

        mercaderia.push(
            item(
                "Categorías",
                ROUTES.categorias
            )
        );

        mercaderia.push(
            item(
                "Subcategorías",
                ROUTES.subcategorias
            )
        );

    }


    if (
        puede(
            "productos.ver"
        )
    ) {

        mercaderia.push(
            item(
                "Productos",
                ROUTES.productos
            )
        );

    }


    if (
        puede(
            "stock.ver"
        )
    ) {

        mercaderia.push(
            item(
                "Stock",
                ROUTES.stock
            )
        );

    }


    if (
        puede(
            "lista_compras.ver"
        )
    ) {

        mercaderia.push(
            item(
                "Lista de compras",
                ROUTES.listaCompras
            )
        );

    }


    const gestion = [];


    if (
        puede(
            "proveedores.ver"
        )
    ) {

        gestion.push(
            item(
                "Proveedores",
                ROUTES.proveedores
            )
        );

    }


    if (
        puedeAlguno(
            "compras.ver",
            "compras.crear"
        )
    ) {

        gestion.push(
            item(
                "Compras",
                ROUTES.compras
            )
        );

    }


    if (
        puede(
            "precios.ver"
        )
    ) {

        gestion.push(
            item(
                "Precios",
                ROUTES.precios
            )
        );

    }


    if (
        puedeAlguno(
            "ventas.ver",
            "ventas.crear"
        )
    ) {

        gestion.push(
            item(
                "Ventas",
                ROUTES.ventas
            )
        );

    }


    if (
        puede(
            "ofertas.ver"
        )
    ) {

        gestion.push(
            item(
                "Ofertas",
                ROUTES.ofertas
            )
        );

    }


    if (
        puede(
            "caja.ver"
        )
    ) {

        gestion.push(
            item(
                "Caja",
                ROUTES.caja
            )
        );

    }


    if (
        puede(
            "gastos.ver"
        )
    ) {

        gestion.push(
            item(
                "Gastos",
                ROUTES.gastos
            )
        );

    }


    if (
        puede(
            "usuarios.ver"
        )
    ) {

        gestion.push(
            item(
                "Usuarios",
                ROUTES.usuarios
            )
        );

    }


    if (
        puede(
            "auditoria.ver"
        )
    ) {

        gestion.push(
            item(
                "Auditoría",
                ROUTES.auditoria
            )
        );

    }


    const template = [

        {
            label:
                "Archivo",

            submenu: [

                {
                    label:
                        "Salir",

                    role:
                        "quit"
                }

            ]
        },

        item(
            "Dashboard",
            ROUTES.dashboard
        )

    ];


    if (
        mercaderia.length >
        0
    ) {

        template.push({

            label:
                "Mercadería",

            submenu:
                mercaderia

        });

    }


    if (
        gestion.length >
        0
    ) {

        template.push({

            label:
                "Gestión",

            submenu:
                gestion

        });

    }


    if (
        puede(
            "reportes.ver"
        )
    ) {

        template.push({

            label:
                "Reportes",

            click() {

                navigateTo(
                    ROUTES.reportes
                );

            }

        });

    }


    const menu =
        Menu.buildFromTemplate(
            template
        );


    Menu.setApplicationMenu(
        menu
    );

}