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
export function registerIpcHandlers() {

    registerCategoriasHandlers();

    registerSubcategoriasHandlers();

    registerProductosHandlers();

    registerStockHandlers();

    registerListaComprasHandlers();

    registerDialogosHandlers();

}