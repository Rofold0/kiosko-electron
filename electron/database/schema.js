export function createSchema(db) {

    db.exec(`
-- ============================================================================
-- CATEGORÍAS Y SUBCATEGORÍAS
-- ============================================================================

CREATE TABLE IF NOT EXISTS categorias (
    id     INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    activo INTEGER NOT NULL DEFAULT 1
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_categorias_nombre_activo 
    ON categorias (LOWER(nombre)) 
    WHERE activo = 1;

CREATE TABLE IF NOT EXISTS subcategorias (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    categoria_id INTEGER NOT NULL,
    nombre       TEXT NOT NULL,
    activo       INTEGER NOT NULL DEFAULT 1,
    FOREIGN KEY (categoria_id) REFERENCES categorias (id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_subcategorias_categoria_nombre 
    ON subcategorias (categoria_id, LOWER(nombre)) 
    WHERE activo = 1;


-- ============================================================================
-- PRODUCTOS E ÍNDICES
-- ============================================================================

CREATE TABLE IF NOT EXISTS productos (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre          TEXT NOT NULL,
    descripcion     TEXT,
    codigo          TEXT,
    categoria_id    INTEGER,
    subcategoria_id INTEGER,
    stock_actual    INTEGER NOT NULL DEFAULT 0,
    stock_minimo    INTEGER NOT NULL DEFAULT 0,
    unidad          TEXT NOT NULL DEFAULT 'unidad',
    activo          INTEGER NOT NULL DEFAULT 1,
    FOREIGN KEY (categoria_id) REFERENCES categorias (id),
    FOREIGN KEY (subcategoria_id) REFERENCES subcategorias (id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_productos_codigo_activo 
    ON productos (LOWER(codigo)) 
    WHERE activo = 1 
      AND codigo IS NOT NULL 
      AND TRIM(codigo) <> '';

CREATE INDEX IF NOT EXISTS idx_productos_categoria_activo 
    ON productos (categoria_id, activo);

CREATE INDEX IF NOT EXISTS idx_productos_subcategoria_activo 
    ON productos (subcategoria_id, activo);

CREATE INDEX IF NOT EXISTS idx_productos_nombre 
    ON productos (nombre COLLATE NOCASE);


-- ============================================================================
-- PRECIOS Y STOCK
-- ============================================================================

CREATE TABLE IF NOT EXISTS precios (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    producto_id  INTEGER NOT NULL,
    costo        REAL NOT NULL DEFAULT 0,
    precio_venta REAL NOT NULL DEFAULT 0,
    fecha_desde  TEXT NOT NULL,
    fecha_hasta  TEXT,
    FOREIGN KEY (producto_id) REFERENCES productos (id)
);

CREATE TABLE IF NOT EXISTS movimientos_stock (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    producto_id    INTEGER NOT NULL,
    tipo           TEXT NOT NULL,
    cantidad       INTEGER NOT NULL,
    stock_anterior INTEGER NOT NULL,
    stock_nuevo    INTEGER NOT NULL,
    motivo         TEXT,
    fecha          TEXT NOT NULL,
    FOREIGN KEY (producto_id) REFERENCES productos (id)
);

CREATE INDEX IF NOT EXISTS idx_movimientos_stock_producto_fecha 
    ON movimientos_stock (producto_id, fecha DESC);


-- ============================================================================
-- LISTAS DE COMPRAS
-- ============================================================================

CREATE TABLE IF NOT EXISTS lista_compras (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    estado           TEXT NOT NULL DEFAULT 'PENDIENTE',
    fecha_creacion   TEXT NOT NULL,
    fecha_completada TEXT,
    notas            TEXT
);

CREATE INDEX IF NOT EXISTS idx_lista_compras_estado_fecha 
    ON lista_compras (estado, fecha_creacion DESC);

CREATE TABLE IF NOT EXISTS items_lista_compras (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    lista_id    INTEGER NOT NULL,
    producto_id INTEGER,
    nombre      TEXT NOT NULL,
    cantidad    INTEGER NOT NULL DEFAULT 1,
    comprado    INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (lista_id) REFERENCES lista_compras (id),
    FOREIGN KEY (producto_id) REFERENCES productos (id)
);

CREATE INDEX IF NOT EXISTS idx_items_lista_compras_lista 
    ON items_lista_compras (lista_id, comprado, id);

CREATE INDEX IF NOT EXISTS idx_items_lista_compras_producto 
    ON items_lista_compras (lista_id, producto_id) 
    WHERE producto_id IS NOT NULL;


-- ============================================================================
-- PROVEEDORES Y COMPRAS
-- ============================================================================

CREATE TABLE IF NOT EXISTS proveedores (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre    TEXT NOT NULL,
    telefono  TEXT,
    direccion TEXT,
    notas     TEXT,
    activo    INTEGER NOT NULL DEFAULT 1
);
CREATE UNIQUE INDEX IF NOT EXISTS
    idx_proveedores_nombre_activo
    ON proveedores(
    LOWER(nombre)
    )
    WHERE activo = 1;

CREATE TABLE IF NOT EXISTS productos_proveedores (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    producto_id      INTEGER NOT NULL,
    proveedor_id     INTEGER NOT NULL,
    codigo_proveedor TEXT,
    ultimo_costo     REAL,
    notas            TEXT,
    FOREIGN KEY (producto_id) REFERENCES productos (id),
    FOREIGN KEY (proveedor_id) REFERENCES proveedores (id)
);
CREATE UNIQUE INDEX IF NOT EXISTS
    idx_productos_proveedores_unico
    ON productos_proveedores(
    producto_id,
    proveedor_id
);


CREATE INDEX IF NOT EXISTS
    idx_productos_proveedores_proveedor
    ON productos_proveedores(
    proveedor_id,
    producto_id
);

CREATE TABLE IF NOT EXISTS compras (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    proveedor_id     INTEGER,
    fecha            TEXT NOT NULL,
    total            REAL NOT NULL DEFAULT 0,
    notas            TEXT,

    estado           TEXT NOT NULL DEFAULT 'ACTIVA',
    fecha_reversion  TEXT,
    motivo_reversion TEXT,

    metodo_pago       TEXT,
    caja_id           INTEGER,
    caja_reversion_id INTEGER,

    FOREIGN KEY (proveedor_id)
        REFERENCES proveedores(id),

    FOREIGN KEY (caja_id)
        REFERENCES cajas(id),

    FOREIGN KEY (caja_reversion_id)
        REFERENCES cajas(id)
);

CREATE TABLE IF NOT EXISTS items_compra (
    id                       INTEGER PRIMARY KEY AUTOINCREMENT,
    compra_id                INTEGER NOT NULL,
    producto_id              INTEGER NOT NULL,
    lista_item_id            INTEGER,
    producto_proveedor_id    INTEGER,

    cantidad                 INTEGER NOT NULL,
    costo_unitario           REAL NOT NULL,
    subtotal                 REAL NOT NULL,

    costo_anterior_proveedor REAL,
    lista_cantidad_anterior  INTEGER,
    lista_comprado_anterior  INTEGER,

    FOREIGN KEY (compra_id)
        REFERENCES compras(id),

    FOREIGN KEY (producto_id)
        REFERENCES productos(id),

    FOREIGN KEY (lista_item_id)
        REFERENCES items_lista_compras(id)
        ON DELETE SET NULL,

    FOREIGN KEY (producto_proveedor_id)
        REFERENCES productos_proveedores(id)
);
CREATE INDEX IF NOT EXISTS
idx_compras_fecha
ON compras(
    fecha DESC
);


CREATE INDEX IF NOT EXISTS
idx_compras_proveedor_fecha
ON compras(
    proveedor_id,
    fecha DESC
);



CREATE INDEX IF NOT EXISTS
idx_items_compra_compra
ON items_compra(
    compra_id
);


CREATE INDEX IF NOT EXISTS
idx_items_compra_producto
ON items_compra(
    producto_id
);


CREATE INDEX IF NOT EXISTS
idx_items_compra_lista_item
ON items_compra(
    lista_item_id
)
WHERE lista_item_id IS NOT NULL;


-- ============================================================================
-- VENTAS Y CAJA
-- ============================================================================

CREATE TABLE IF NOT EXISTS ventas (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    fecha            TEXT NOT NULL,
    total            REAL NOT NULL DEFAULT 0,
    metodo_pago      TEXT,
    notas            TEXT,

    estado           TEXT NOT NULL DEFAULT 'ACTIVA',
    fecha_reversion  TEXT,
    motivo_reversion TEXT
);

CREATE TABLE IF NOT EXISTS items_venta (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    venta_id        INTEGER NOT NULL,
    producto_id     INTEGER NOT NULL,
    precio_id       INTEGER,

    cantidad        INTEGER NOT NULL,
    costo_unitario  REAL NOT NULL DEFAULT 0,
    precio_unitario REAL NOT NULL,
    subtotal        REAL NOT NULL,

    FOREIGN KEY (venta_id)
        REFERENCES ventas(id),

    FOREIGN KEY (producto_id)
        REFERENCES productos(id),

    FOREIGN KEY (precio_id)
        REFERENCES precios(id)
);

CREATE TABLE IF NOT EXISTS categorias_gasto (
    id     INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    activo INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS gastos (
    id                 INTEGER PRIMARY KEY AUTOINCREMENT,

    categoria_id       INTEGER,
    categoria          TEXT NOT NULL,

    descripcion        TEXT,
    monto              REAL NOT NULL,
    fecha              TEXT NOT NULL,

    metodo_pago        TEXT NOT NULL DEFAULT 'EFECTIVO',

    notas              TEXT,

    estado             TEXT NOT NULL DEFAULT 'ACTIVO',

    fecha_reversion    TEXT,
    motivo_reversion   TEXT,

    caja_id            INTEGER,
    caja_reversion_id  INTEGER,

    FOREIGN KEY (categoria_id)
        REFERENCES categorias_gasto(id),

    FOREIGN KEY (caja_id)
        REFERENCES cajas(id),

    FOREIGN KEY (caja_reversion_id)
        REFERENCES cajas(id)
);

CREATE TABLE IF NOT EXISTS cajas (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,

    fecha_apertura    TEXT NOT NULL,
    saldo_inicial     REAL NOT NULL DEFAULT 0,

    fecha_cierre      TEXT,

    efectivo_esperado REAL,
    efectivo_real     REAL,
    diferencia        REAL,

    notas_apertura    TEXT,
    notas_cierre      TEXT,

    estado            TEXT NOT NULL DEFAULT 'ABIERTA'
);

CREATE TABLE IF NOT EXISTS movimientos_caja (
    id                   INTEGER PRIMARY KEY AUTOINCREMENT,

    tipo                 TEXT NOT NULL,
    concepto             TEXT NOT NULL,
    monto                REAL NOT NULL,
    fecha                TEXT NOT NULL,

    caja_id              INTEGER,
    metodo_pago          TEXT,

    venta_id             INTEGER,
    gasto_id             INTEGER,
    compra_id            INTEGER,
    movimiento_origen_id INTEGER,

   

    notas                TEXT,

    FOREIGN KEY (caja_id)
        REFERENCES cajas(id),

    FOREIGN KEY (venta_id)
        REFERENCES ventas(id),

    FOREIGN KEY (gasto_id)
        REFERENCES gastos(id),

    FOREIGN KEY (movimiento_origen_id)
        REFERENCES movimientos_caja(id),

    FOREIGN KEY (compra_id)
        REFERENCES compras(id)
);
    `);

}