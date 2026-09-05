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

export function registerIpcHandlers() {

    registerCategoriasHandlers();
    registerSubcategoriasHandlers();
    registerProductosHandlers();
    registerDialogosHandlers();

}