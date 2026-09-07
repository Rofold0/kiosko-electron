import {
    registerCategoriasHandlers
} from "./categorias.js";

import {
    registerSubcategoriasHandlers
} from "./subcategorias.js";
import {
    registerDialogosHandlers
} from "./dialogos.js";
import {
    registerProductosHandlers
} from "./productos.js";
import {
    registerStockHandlers
} from "./stock.js";
import {
    registerListaComprasHandlers
} from "./listaCompras.js";
import {
    registerProveedoresHandlers
} from "./proveedores.js";
import {
    registerComprasHandlers
} from "./compras.js";
import {
    registerPreciosHandlers
} from "./precios.js";
export function registerIpcHandlers() {

    registerCategoriasHandlers();

    registerSubcategoriasHandlers();

    registerProductosHandlers();

    registerStockHandlers();

    registerListaComprasHandlers();
    
    registerProveedoresHandlers();

    registerComprasHandlers();

    registerPreciosHandlers();

    registerDialogosHandlers();

}