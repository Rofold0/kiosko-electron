import {
    registerCategoriasHandlers
} from "./categorias.js";

import {
    registerSubcategoriasHandlers
} from "./subcategorias.js";

export function registerIpcHandlers() {

    registerCategoriasHandlers();
    registerSubcategoriasHandlers();

}