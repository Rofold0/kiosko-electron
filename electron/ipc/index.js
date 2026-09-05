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
export function registerIpcHandlers() {

    registerCategoriasHandlers();

    registerSubcategoriasHandlers();

    registerProductosHandlers();

    registerStockHandlers();

    registerListaComprasHandlers();
    
    registerProveedoresHandlers();

    registerDialogosHandlers();

}