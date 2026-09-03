function createSubcategoriasTable(db) {
    db.prepare(`CREATE TABLE IF NOT EXISTS subcategorias (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    activo INTEGER NOT NULL DEFAULT 1
);`)
}
function createSubcategoriasIndex(db) {
    db.prepare(`CREATE UNIQUE INDEX IF NOT EXISTS
idx_subcategorias_nombre
ON subcategorias(LOWER(nombre))
WHERE activo = 1;`)
}
function createCategoriasTable(db) {
    db.prepare(`CREATE TABLE IF NOT EXISTS categorias (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    subcategoria foreign key REFERENCES subcategorias(id),
    activo INTEGER NOT NULL DEFAULT 1
);`)
}
function createCategoriasIndex(db) {
    db.prepare(`CREATE UNIQUE INDEX IF NOT EXISTS
idx_categorias_nombre_activo
ON categorias(LOWER(nombre))
WHERE activo = 1;`)
}
function createProductosTable(db) {
    db.prepare(`CREATE TABLE  IF NOT EXISTS productos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    descripcion TEXT,
    codigo TEXT,
    categoria_id INTEGER,
    stock_actual INTEGER NOT NULL DEFAULT 0,
    stock_minimo INTEGER NOT NULL DEFAULT 0,
    unidad TEXT NOT NULL DEFAULT 'unidad',
    activo INTEGER NOT NULL DEFAULT 1,

    FOREIGN KEY (categoria_id)
        REFERENCES categorias(id)
);`)
}
function createListaComprasTable(db) {
    db.prepare(`
    CREATE TABLE IF NOT EXISTS lista_compras (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    estado TEXT NOT NULL DEFAULT 'PENDIENTE',
    fecha_creacion TEXT NOT NULL,
    fecha_completada TEXT,
    notas TEXT
);`)
}
function createItemsListaComprasTable(db) {
    db.prepare(`
    CREATE TABLE IF NOT EXISTS items_lista_compras (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lista_id INTEGER NOT NULL,
    producto_id INTEGER,
    nombre TEXT NOT NULL,
    cantidad INTEGER NOT NULL DEFAULT 1,
    comprado INTEGER NOT NULL DEFAULT 0,

    FOREIGN KEY (lista_id)
        REFERENCES lista_compras(id),

    FOREIGN KEY (producto_id)
        REFERENCES productos(id)
);`)
}
function createPreciosTable(db) {
    db.prepare(`CREATE TABLE IF NOT EXISTS precios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    producto_id INTEGER NOT NULL,
    costo REAL NOT NULL DEFAULT 0,
    precio_venta REAL NOT NULL DEFAULT 0,
    fecha_desde TEXT NOT NULL,
    fecha_hasta TEXT,

    FOREIGN KEY (producto_id)
        REFERENCES productos(id)
);`)
}
function createMovimientosStockTable(db) {
    db.prepare(`CREATE TABLE IF NOT EXISTS movimientos_stock (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    producto_id INTEGER NOT NULL,
    tipo TEXT NOT NULL,
    cantidad INTEGER NOT NULL,
    stock_anterior INTEGER NOT NULL,
    stock_nuevo INTEGER NOT NULL,
    motivo TEXT,
    fecha TEXT NOT NULL,

    FOREIGN KEY (producto_id)
        REFERENCES productos(id)
);`)
}
function createProveedoresTable(db) {
    db.prepare(`CREATE TABLE IF NOT EXISTS proveedores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    telefono TEXT,
    direccion TEXT,
    notas TEXT,
    activo INTEGER NOT NULL DEFAULT 1
);`)
}
function createProductosProveedoresTable(db) {
    db.prepare(`CREATE TABLE IF NOT EXISTS productos_proveedores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    producto_id INTEGER NOT NULL,
    proveedor_id INTEGER NOT NULL,
    codigo_proveedor TEXT,
    ultimo_costo REAL,
    notas TEXT,

    FOREIGN KEY (producto_id)
        REFERENCES productos(id),

    FOREIGN KEY (proveedor_id)
        REFERENCES proveedores(id)
);`)
}
function createComprasTable(db) {
    db.prepare(`CREATE TABLE IF NOT EXISTS compras (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    proveedor_id INTEGER,
    fecha TEXT NOT NULL,
    total REAL NOT NULL DEFAULT 0,
    notas TEXT,

    FOREIGN KEY (proveedor_id)
        REFERENCES proveedores(id)
`);
}
function createItemsCompraTable(db) {
    db.prepare(`CREATE TABLE IF NOT EXISTS items_compra (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    compra_id INTEGER NOT NULL,
    producto_id INTEGER NOT NULL,
    cantidad INTEGER NOT NULL,
    costo_unitario REAL NOT NULL,
    subtotal REAL NOT NULL,

    FOREIGN KEY (compra_id)
        REFERENCES compras(id),

    FOREIGN KEY (producto_id)
        REFERENCES productos(id)
);`)
}
function createVentasTable(db) {
    db.prepare(`CREATE TABLE IF NOT EXISTS ventas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fecha TEXT NOT NULL,
    total REAL NOT NULL DEFAULT 0,
    metodo_pago TEXT,
    notas TEXT
);`)
}
function createItemsVentaTable(db) {
    db.prepare(`CREATE TABLE IF NOT EXISTS items_venta (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    venta_id INTEGER NOT NULL,
    producto_id INTEGER NOT NULL,
    cantidad INTEGER NOT NULL,
    precio_unitario REAL NOT NULL,
    subtotal REAL NOT NULL,

    FOREIGN KEY (venta_id)
        REFERENCES ventas(id),

    FOREIGN KEY (producto_id)
        REFERENCES productos(id)
);`)
}
function createGastosTable(db) {
    db.prepare(`CREATE TABLE IF NOT EXISTS gastos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    categoria TEXT NOT NULL,
    descripcion TEXT,
    monto REAL NOT NULL,
    fecha TEXT NOT NULL,
    notas TEXT
);`)
}
function createMovimientosCajaTable(db) {
    db.prepare(`CREATE TABLE IF NOT EXISTS movimientos_caja (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tipo TEXT NOT NULL,
    concepto TEXT NOT NULL,
    monto REAL NOT NULL,
    fecha TEXT NOT NULL,
    venta_id INTEGER,
    gasto_id INTEGER,
    notas TEXT,
    FOREIGN KEY (venta_id) REFERENCES ventas(id),
    FOREIGN KEY (gasto_id) REFERENCES gastos(id)
);`)
}


export function createSchema(db) {

    createSubcategoriasTable(db);
    createSubcategoriasIndex(db);
    createCategoriasTable(db);
    createCategoriasIndex(db);
    createProductosTable(db);
    createListaComprasTable(db);
    createItemsListaComprasTable(db);
    createPreciosTable(db);
    createMovimientosStockTable(db);
    createProveedoresTable(db);
    createProductosProveedoresTable(db);
    createComprasTable(db);
    createItemsCompraTable(db);
    createVentasTable(db);
    createItemsVentaTable(db);
    createGastosTable(db);
    createMovimientosCajaTable(db);

}