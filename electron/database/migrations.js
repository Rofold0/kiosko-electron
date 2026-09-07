const migrations = [

    {
        version: 1,

        name: "productos-subcategoria-indices",

        up(db) {

            const columnas =
                db.pragma(
                    "table_info(productos)"
                );


            const tieneSubcategoria =
                columnas.some(
                    (columna) =>
                        columna.name ===
                        "subcategoria_id"
                );


            if (!tieneSubcategoria) {

                db.exec(`
                    ALTER TABLE productos
                    ADD COLUMN subcategoria_id INTEGER
                    REFERENCES subcategorias(id);
                `);

            }


            db.exec(`
                CREATE UNIQUE INDEX IF NOT EXISTS
                idx_productos_codigo_activo
                ON productos(
                    LOWER(codigo)
                )
                WHERE
                    activo = 1
                    AND codigo IS NOT NULL
                    AND TRIM(codigo) <> '';


                CREATE INDEX IF NOT EXISTS
                idx_productos_categoria_activo
                ON productos(
                    categoria_id,
                    activo
                );


                CREATE INDEX IF NOT EXISTS
                idx_productos_subcategoria_activo
                ON productos(
                    subcategoria_id,
                    activo
                );


                CREATE INDEX IF NOT EXISTS
                idx_productos_nombre
                ON productos(
                    nombre COLLATE NOCASE
                );
            `);

        }
    },
    {
        version: 2,

        name: "historial-stock",

        up(db) {

            db.exec(`
            CREATE INDEX IF NOT EXISTS
            idx_movimientos_stock_producto_fecha
            ON movimientos_stock(
                producto_id,
                fecha DESC
            );
        `);


            db.exec(`
            INSERT INTO movimientos_stock (
                producto_id,
                tipo,
                cantidad,
                stock_anterior,
                stock_nuevo,
                motivo,
                fecha
            )

            SELECT
                p.id,
                'INICIAL',
                p.stock_actual,
                0,
                p.stock_actual,
                'Stock existente al iniciar historial',
                strftime(
                    '%Y-%m-%dT%H:%M:%fZ',
                    'now'
                )

            FROM productos p

            WHERE
                p.activo = 1
                AND p.stock_actual > 0

                AND NOT EXISTS (
                    SELECT 1
                    FROM movimientos_stock m
                    WHERE m.producto_id = p.id
                );
        `);

        }
    },
    {
        version: 3,

        name: "indices-lista-compras",

        up(db) {

            db.exec(`
            CREATE INDEX IF NOT EXISTS
            idx_lista_compras_estado_fecha
            ON lista_compras(
                estado,
                fecha_creacion DESC
            );


            CREATE INDEX IF NOT EXISTS
            idx_items_lista_compras_lista
            ON items_lista_compras(
                lista_id,
                comprado,
                id
            );


            CREATE INDEX IF NOT EXISTS
            idx_items_lista_compras_producto
            ON items_lista_compras(
                lista_id,
                producto_id
            )
            WHERE producto_id IS NOT NULL;
        `);

        },
        
    },
    {
    version: 4,

    name: "indices-proveedores",

    up(db) {

        db.exec(`
            CREATE UNIQUE INDEX IF NOT EXISTS
            idx_proveedores_nombre_activo
            ON proveedores(
                LOWER(nombre)
            )
            WHERE activo = 1;


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
        `);

    }
},
{
    version: 5,

    name: "compras-integracion-lista-indices",

    up(db) {

        const columnas =
            db.pragma(
                "table_info(items_compra)"
            );


        const tieneListaItem =
            columnas.some(
                (columna) =>
                    columna.name ===
                    "lista_item_id"
            );


        if (!tieneListaItem) {

            db.exec(`
                ALTER TABLE items_compra

                ADD COLUMN lista_item_id
                    INTEGER
                    REFERENCES items_lista_compras(id)
                    ON DELETE SET NULL;
            `);

        }


        db.exec(`
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
        `);

    }
},
{
    version: 6,

    name: "reversion-compras",

    up(db) {

        const columnasCompras =
            db.pragma(
                "table_info(compras)"
            );


        const tieneEstado =
            columnasCompras.some(
                (columna) =>
                    columna.name === "estado"
            );

        const tieneFechaReversion =
            columnasCompras.some(
                (columna) =>
                    columna.name ===
                    "fecha_reversion"
            );

        const tieneMotivoReversion =
            columnasCompras.some(
                (columna) =>
                    columna.name ===
                    "motivo_reversion"
            );


        if (!tieneEstado) {

            db.exec(`
                ALTER TABLE compras
                ADD COLUMN estado TEXT
                NOT NULL
                DEFAULT 'ACTIVA';
            `);

        }


        if (!tieneFechaReversion) {

            db.exec(`
                ALTER TABLE compras
                ADD COLUMN fecha_reversion TEXT;
            `);

        }


        if (!tieneMotivoReversion) {

            db.exec(`
                ALTER TABLE compras
                ADD COLUMN motivo_reversion TEXT;
            `);

        }


        const columnasItems =
            db.pragma(
                "table_info(items_compra)"
            );


        const agregarColumna =
            (
                nombre,
                sql
            ) => {

                const existe =
                    columnasItems.some(
                        (columna) =>
                            columna.name === nombre
                    );


                if (!existe) {
                    db.exec(sql);
                }

            };


        agregarColumna(
            "producto_proveedor_id",
            `
                ALTER TABLE items_compra
                ADD COLUMN producto_proveedor_id
                INTEGER
                REFERENCES productos_proveedores(id);
            `
        );


        agregarColumna(
            "costo_anterior_proveedor",
            `
                ALTER TABLE items_compra
                ADD COLUMN costo_anterior_proveedor REAL;
            `
        );


        agregarColumna(
            "lista_cantidad_anterior",
            `
                ALTER TABLE items_compra
                ADD COLUMN lista_cantidad_anterior INTEGER;
            `
        );


        agregarColumna(
            "lista_comprado_anterior",
            `
                ALTER TABLE items_compra
                ADD COLUMN lista_comprado_anterior INTEGER;
            `
        );


        db.exec(`
            CREATE INDEX IF NOT EXISTS
            idx_compras_estado_fecha
            ON compras(
                estado,
                fecha DESC
            );
        `);

    }
},
{
    version: 7,

    name: "precios-vigentes-indices",

    up(db) {

        /*
         * Por seguridad, si hubiese más de
         * un precio vigente viejo para un
         * producto, dejamos sólo el último.
         */

        db.exec(`
            UPDATE precios

            SET fecha_hasta =
                strftime(
                    '%Y-%m-%dT%H:%M:%fZ',
                    'now'
                )

            WHERE
                fecha_hasta IS NULL

                AND id NOT IN (
                    SELECT
                        MAX(id)

                    FROM precios

                    WHERE
                        fecha_hasta IS NULL

                    GROUP BY
                        producto_id
                );
        `);


        db.exec(`
            CREATE UNIQUE INDEX IF NOT EXISTS
            idx_precios_producto_vigente
            ON precios(
                producto_id
            )
            WHERE
                fecha_hasta IS NULL;


            CREATE INDEX IF NOT EXISTS
            idx_precios_producto_fecha
            ON precios(
                producto_id,
                fecha_desde DESC
            );
        `);

    }
},
{
    version: 8,

    name: "ventas-reversion-costos-indices",

    up(db) {

        const columnasVentas =
            db.pragma(
                "table_info(ventas)"
            );


        const agregarVenta =
            (nombre, sql) => {

                const existe =
                    columnasVentas.some(
                        (columna) =>
                            columna.name === nombre
                    );


                if (!existe) {
                    db.exec(sql);
                }

            };


        agregarVenta(
            "estado",
            `
                ALTER TABLE ventas
                ADD COLUMN estado TEXT
                NOT NULL
                DEFAULT 'ACTIVA';
            `
        );


        agregarVenta(
            "fecha_reversion",
            `
                ALTER TABLE ventas
                ADD COLUMN fecha_reversion TEXT;
            `
        );


        agregarVenta(
            "motivo_reversion",
            `
                ALTER TABLE ventas
                ADD COLUMN motivo_reversion TEXT;
            `
        );


        const columnasItems =
            db.pragma(
                "table_info(items_venta)"
            );


        const agregarItem =
            (nombre, sql) => {

                const existe =
                    columnasItems.some(
                        (columna) =>
                            columna.name === nombre
                    );


                if (!existe) {
                    db.exec(sql);
                }

            };


        agregarItem(
            "precio_id",
            `
                ALTER TABLE items_venta
                ADD COLUMN precio_id INTEGER
                REFERENCES precios(id);
            `
        );


        agregarItem(
            "costo_unitario",
            `
                ALTER TABLE items_venta
                ADD COLUMN costo_unitario REAL
                NOT NULL
                DEFAULT 0;
            `
        );


        db.exec(`
            CREATE INDEX IF NOT EXISTS
            idx_ventas_fecha
            ON ventas(fecha DESC);


            CREATE INDEX IF NOT EXISTS
            idx_ventas_estado_fecha
            ON ventas(
                estado,
                fecha DESC
            );


            CREATE INDEX IF NOT EXISTS
            idx_ventas_metodo_fecha
            ON ventas(
                metodo_pago,
                fecha DESC
            );


            CREATE INDEX IF NOT EXISTS
            idx_items_venta_venta
            ON items_venta(venta_id);


            CREATE INDEX IF NOT EXISTS
            idx_items_venta_producto
            ON items_venta(producto_id);


            CREATE INDEX IF NOT EXISTS
            idx_movimientos_caja_venta
            ON movimientos_caja(venta_id);
        `);

    }
},
{
    version: 9,

    name: "sesiones-caja-metodos-movimientos",

    up(db) {

        db.exec(`
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
        `);


        const columnas =
            db.pragma(
                "table_info(movimientos_caja)"
            );


        const agregarColumna =
            (
                nombre,
                sql
            ) => {

                const existe =
                    columnas.some(
                        (columna) =>
                            columna.name ===
                            nombre
                    );


                if (!existe) {
                    db.exec(sql);
                }

            };


        agregarColumna(
            "caja_id",
            `
                ALTER TABLE movimientos_caja
                ADD COLUMN caja_id INTEGER
                REFERENCES cajas(id);
            `
        );


        agregarColumna(
            "metodo_pago",
            `
                ALTER TABLE movimientos_caja
                ADD COLUMN metodo_pago TEXT;
            `
        );


        agregarColumna(
            "movimiento_origen_id",
            `
                ALTER TABLE movimientos_caja
                ADD COLUMN movimiento_origen_id INTEGER
                REFERENCES movimientos_caja(id);
            `
        );


        /*
         * Recuperamos el método de pago
         * de las ventas anteriores.
         *
         * Dejamos caja_id NULL porque
         * no inventamos sesiones históricas.
         */

        db.exec(`
            UPDATE movimientos_caja

            SET metodo_pago = (
                SELECT
                    v.metodo_pago

                FROM ventas v

                WHERE
                    v.id =
                    movimientos_caja.venta_id
            )

            WHERE
                metodo_pago IS NULL
                AND venta_id IS NOT NULL;
        `);


        db.exec(`
            CREATE UNIQUE INDEX IF NOT EXISTS
            idx_cajas_unica_abierta
            ON cajas(estado)
            WHERE estado = 'ABIERTA';


            CREATE INDEX IF NOT EXISTS
            idx_cajas_apertura
            ON cajas(fecha_apertura DESC);


            CREATE INDEX IF NOT EXISTS
            idx_movimientos_caja_caja_fecha
            ON movimientos_caja(
                caja_id,
                fecha DESC
            );


            CREATE INDEX IF NOT EXISTS
            idx_movimientos_caja_metodo
            ON movimientos_caja(
                caja_id,
                metodo_pago
            );


            CREATE INDEX IF NOT EXISTS
            idx_movimientos_caja_origen
            ON movimientos_caja(
                movimiento_origen_id
            )
            WHERE movimiento_origen_id
                IS NOT NULL;
        `);

    }
},
{
    version: 10,

    name: "gastos-categorias-caja-reversion",

    up(db) {

        db.exec(`
            CREATE TABLE IF NOT EXISTS categorias_gasto (
                id     INTEGER PRIMARY KEY AUTOINCREMENT,
                nombre TEXT NOT NULL,
                activo INTEGER NOT NULL DEFAULT 1
            );


            CREATE UNIQUE INDEX IF NOT EXISTS
            idx_categorias_gasto_nombre_activo
            ON categorias_gasto(
                LOWER(nombre)
            )
            WHERE activo = 1;
        `);


        /*
         * Categorías iniciales.
         */

        const categoriasIniciales = [
            "Mercadería",
            "Servicios",
            "Alquiler",
            "Transporte",
            "Mantenimiento",
            "Limpieza",
            "Impuestos",
            "Insumos",
            "Retiro personal",
            "Otro"
        ];


        const insertarCategoria =
            db.prepare(`
                INSERT OR IGNORE
                INTO categorias_gasto (
                    nombre,
                    activo
                )

                VALUES (?, 1)
            `);


        for (
            const nombre
            of categoriasIniciales
        ) {

            insertarCategoria.run(
                nombre
            );

        }


        /*
         * Recuperamos categorías que
         * pudieran existir en gastos viejos.
         */

        db.exec(`
            INSERT OR IGNORE
            INTO categorias_gasto (
                nombre,
                activo
            )

            SELECT DISTINCT
                TRIM(categoria),
                1

            FROM gastos

            WHERE
                categoria IS NOT NULL
                AND TRIM(categoria) <> '';
        `);


        const columnas =
            db.pragma(
                "table_info(gastos)"
            );


        const agregarColumna =
            (
                nombre,
                sql
            ) => {

                const existe =
                    columnas.some(
                        (columna) =>
                            columna.name ===
                            nombre
                    );


                if (!existe) {
                    db.exec(sql);
                }

            };


        agregarColumna(
            "categoria_id",
            `
                ALTER TABLE gastos
                ADD COLUMN categoria_id INTEGER
                REFERENCES categorias_gasto(id);
            `
        );


        agregarColumna(
            "metodo_pago",
            `
                ALTER TABLE gastos
                ADD COLUMN metodo_pago TEXT;
            `
        );


        agregarColumna(
            "estado",
            `
                ALTER TABLE gastos
                ADD COLUMN estado TEXT
                NOT NULL
                DEFAULT 'ACTIVO';
            `
        );


        agregarColumna(
            "fecha_reversion",
            `
                ALTER TABLE gastos
                ADD COLUMN fecha_reversion TEXT;
            `
        );


        agregarColumna(
            "motivo_reversion",
            `
                ALTER TABLE gastos
                ADD COLUMN motivo_reversion TEXT;
            `
        );


        agregarColumna(
            "caja_id",
            `
                ALTER TABLE gastos
                ADD COLUMN caja_id INTEGER
                REFERENCES cajas(id);
            `
        );


        agregarColumna(
            "caja_reversion_id",
            `
                ALTER TABLE gastos
                ADD COLUMN caja_reversion_id INTEGER
                REFERENCES cajas(id);
            `
        );


        /*
         * Vinculamos gastos históricos
         * con su categoría.
         */

        db.exec(`
            UPDATE gastos

            SET categoria_id = (
                SELECT cg.id

                FROM categorias_gasto cg

                WHERE
                    LOWER(cg.nombre) =
                    LOWER(gastos.categoria)
                    AND cg.activo = 1

                LIMIT 1
            )

            WHERE categoria_id IS NULL;
        `);


        /*
         * Si hubiese gastos antiguos sin
         * método, no inventamos efectivo:
         * usamos OTRO.
         */

        db.exec(`
            UPDATE gastos

            SET metodo_pago = 'OTRO'

            WHERE
                metodo_pago IS NULL
                OR TRIM(metodo_pago) = '';
        `);


        db.exec(`
            CREATE INDEX IF NOT EXISTS
            idx_gastos_fecha
            ON gastos(fecha DESC);


            CREATE INDEX IF NOT EXISTS
            idx_gastos_estado_fecha
            ON gastos(
                estado,
                fecha DESC
            );


            CREATE INDEX IF NOT EXISTS
            idx_gastos_categoria_fecha
            ON gastos(
                categoria_id,
                fecha DESC
            );


            CREATE INDEX IF NOT EXISTS
            idx_gastos_caja
            ON gastos(caja_id);


            CREATE INDEX IF NOT EXISTS
            idx_movimientos_caja_gasto
            ON movimientos_caja(gasto_id);
        `);

    }
},
{
    version: 11,

    name: "compras-integracion-caja",

    up(db) {

        const columnasCompras =
            db.pragma(
                "table_info(compras)"
            );


        const agregarCompra =
            (nombre, sql) => {

                const existe =
                    columnasCompras.some(
                        (columna) =>
                            columna.name === nombre
                    );


                if (!existe) {
                    db.exec(sql);
                }

            };


        agregarCompra(
            "metodo_pago",
            `
                ALTER TABLE compras
                ADD COLUMN metodo_pago TEXT;
            `
        );


        agregarCompra(
            "caja_id",
            `
                ALTER TABLE compras
                ADD COLUMN caja_id INTEGER
                REFERENCES cajas(id);
            `
        );


        agregarCompra(
            "caja_reversion_id",
            `
                ALTER TABLE compras
                ADD COLUMN caja_reversion_id INTEGER
                REFERENCES cajas(id);
            `
        );


        const columnasCaja =
            db.pragma(
                "table_info(movimientos_caja)"
            );


        const tieneCompraId =
            columnasCaja.some(
                (columna) =>
                    columna.name ===
                    "compra_id"
            );


        if (!tieneCompraId) {

            db.exec(`
                ALTER TABLE movimientos_caja
                ADD COLUMN compra_id INTEGER
                REFERENCES compras(id);
            `);

        }


        db.exec(`
            CREATE INDEX IF NOT EXISTS
            idx_compras_caja
            ON compras(caja_id);


            CREATE INDEX IF NOT EXISTS
            idx_movimientos_caja_compra
            ON movimientos_caja(compra_id);
        `);

    }
},
{
    version: 12,

    name: "reportes-indices",

    up(db) {

        db.exec(`
            CREATE INDEX IF NOT EXISTS
            idx_compras_estado_fecha
            ON compras(
                estado,
                fecha DESC
            );


            CREATE INDEX IF NOT EXISTS
            idx_movimientos_caja_fecha
            ON movimientos_caja(
                fecha DESC
            );
        `);

    }
}
];


export function runMigrations(db) {

    const versionActual =
        db.pragma(
            "user_version",
            {
                simple: true
            }
        );


    const pendientes =
        migrations.filter(
            (migration) =>
                migration.version >
                versionActual
        );


    for (
        const migration
        of pendientes
    ) {

        const ejecutar =
            db.transaction(() => {

                migration.up(db);

                db.pragma(
                    `user_version = ${migration.version
                    }`
                );

            });


        ejecutar();

        console.log(
            `Migración ${migration.version}: ${migration.name}`
        );

    }
    

}