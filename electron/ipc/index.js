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
import {
    registerVentasHandlers
} from "./ventas.js";
import {
    registerCajaHandlers
} from "./caja.js";
import {
    registerGastosHandlers
} from "./gastos.js";
import {
    registerReportesHandlers
} from "./reportes.js";
import {
    registerUsuariosHandlers
} from "./usuarios.js";
export function registerIpcHandlers() {
    registerUsuariosHandlers();
    
    registerCategoriasHandlers();

    registerSubcategoriasHandlers();

    registerProductosHandlers();

    registerStockHandlers();

    registerListaComprasHandlers();
    
    registerProveedoresHandlers();

    registerComprasHandlers();

    registerPreciosHandlers();

    registerVentasHandlers();

    registerCajaHandlers();

    registerGastosHandlers();

    registerReportesHandlers();

    registerDialogosHandlers();

}