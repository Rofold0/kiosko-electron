import {
    ipcMain
} from "electron";

import {
    exigirPermiso
} from "./session.js";


export const IPC_PERMISSIONS =
    Object.freeze({

        /*
         * CATEGORÍAS
         */

        "categorias:listar":
            "categorias.ver",

        "categorias:crear":
            "categorias.modificar",

        "categorias:actualizar":
            "categorias.modificar",

        "categorias:eliminar":
            "categorias.modificar",


        /*
         * SUBCATEGORÍAS
         *
         * Usamos el mismo permiso de
         * Categorías para no inflar
         * innecesariamente la matriz.
         */

        "subcategorias:listar":
            "categorias.ver",

        "subcategorias:crear":
            "categorias.modificar",

        "subcategorias:actualizar":
            "categorias.modificar",

        "subcategorias:eliminar":
            "categorias.modificar",


        /*
         * PRODUCTOS
         */

        "productos:listar":
            "productos.ver",

        "productos:crear":
            "productos.modificar",

        "productos:actualizar":
            "productos.modificar",

        "productos:eliminar":
            "productos.modificar",


        /*
         * STOCK
         */

        "stock:entrada":
            "stock.ajustar",

        "stock:salida":
            "stock.ajustar",

        "stock:ajustar":
            "stock.ajustar",

        "stock:movimientos":
            "stock.ver",

        "stock:bajo-minimo":
            "stock.ver",


        /*
         * LISTA DE COMPRAS
         */

        "lista-compras:actual":
            "lista_compras.ver",

        "lista-compras:historial":
            "lista_compras.ver",

        "lista-compras:obtener":
            "lista_compras.ver",

        "lista-compras:agregar-producto":
            "lista_compras.modificar",

        "lista-compras:agregar-libre":
            "lista_compras.modificar",

        "lista-compras:cantidad":
            "lista_compras.modificar",

        "lista-compras:comprado":
            "lista_compras.modificar",

        "lista-compras:eliminar-item":
            "lista_compras.modificar",

        "lista-compras:notas":
            "lista_compras.modificar",

        "lista-compras:agregar-stock-bajo":
            "lista_compras.modificar",

        "lista-compras:completar":
            "lista_compras.modificar",


        /*
         * PROVEEDORES
         */

        "proveedores:listar":
            "proveedores.ver",

        "proveedores:productos":
            "proveedores.ver",

        "proveedores:por-producto":
            "proveedores.ver",

        "proveedores:crear":
            "proveedores.modificar",

        "proveedores:actualizar":
            "proveedores.modificar",

        "proveedores:eliminar":
            "proveedores.modificar",

        "proveedores:vincular-producto":
            "proveedores.modificar",

        "proveedores:actualizar-vinculo":
            "proveedores.modificar",

        "proveedores:desvincular-producto":
            "proveedores.modificar",


        /*
         * COMPRAS
         */

        "compras:crear":
            "compras.crear",

        "compras:pendientes-proveedor":
            "compras.crear",

        "compras:listar":
            "compras.ver",

        "compras:obtener":
            "compras.ver",

        "compras:revertir":
            "compras.revertir",


        /*
         * PRECIOS
         */

        "precios:listar":
            "precios.ver",

        "precios:detalle":
            "precios.ver",

        "precios:vigente":
            "precios.ver",

        "precios:guardar":
            "precios.modificar",


        /*
         * VENTAS
         */

        "ventas:productos":
            "ventas.crear",

        "ventas:crear":
            "ventas.crear",

        "ventas:listar":
            "ventas.ver",

        "ventas:obtener":
            "ventas.ver",

        "ventas:revertir":
            "ventas.revertir",


        /*
         * CAJA
         */

        "caja:actual":
            "caja.ver",

        "caja:movimientos":
            "caja.ver",

        "caja:historial":
            "caja.ver",

        "caja:obtener":
            "caja.ver",

        "caja:abrir":
            "caja.abrir",

        "caja:cerrar":
            "caja.cerrar",

        "caja:movimiento-manual":
            "caja.movimiento",

        "caja:revertir-manual":
            "caja.revertir",


        /*
         * GASTOS
         */

        "gastos:categorias-listar":
            "gastos.ver",

        "gastos:listar":
            "gastos.ver",

        "gastos:obtener":
            "gastos.ver",

        /*
         * Por ahora la administración
         * de categorías queda ligada
         * al permiso de crear gastos.
         */

        "gastos:categoria-crear":
            "gastos.crear",

        "gastos:categoria-actualizar":
            "gastos.crear",

        "gastos:categoria-eliminar":
            "gastos.crear",

        "gastos:crear":
            "gastos.crear",

        "gastos:revertir":
            "gastos.revertir",


        /*
         * REPORTES
         */

        "reportes:dashboard":
            "reportes.ver",

        "reportes:exportar-pdf":
            "reportes.exportar",

        "reportes:exportar-csv":
            "reportes.exportar",

        "reportes:exportar-excel":
            "reportes.exportar",

        "reportes:imprimir":
            "reportes.exportar",
            
        /*
         * AUDITORÍA
         */

        "auditoria:listar":
            "auditoria.ver",

    });


export function handleProtegido(
    canal,
    handler
) {

    const permiso =
        IPC_PERMISSIONS[
        canal
        ];


    /*
     * FAIL CLOSED:
     *
     * Si alguien registra un canal
     * mediante handleProtegido pero
     * olvida agregar su permiso,
     * la aplicación falla al iniciar.
     */

    if (!permiso) {

        throw new Error(
            `El canal IPC "${canal}" no tiene un permiso asignado.`
        );

    }


    ipcMain.handle(
        canal,

        (
            event,
            ...argumentos
        ) => {

            exigirPermiso(
                event,
                permiso
            );


            return handler(
                event,
                ...argumentos
            );

        }
    );

}