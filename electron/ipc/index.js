import {
    registerCategoriasHandlers
} from "./categorias.js";

import {
    registerSubcategoriasHandlers
} from "./subcategorias.js";
import {
    registerDialogosHandlers
} from "./dialogos.js";

export function registerIpcHandlers() {

    registerCategoriasHandlers();
    registerSubcategoriasHandlers();
    registerDialogosHandlers();

}