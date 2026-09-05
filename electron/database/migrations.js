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
                    `user_version = ${
                        migration.version
                    }`
                );

            });


        ejecutar();

        console.log(
            `Migración ${migration.version}: ${migration.name}`
        );

    }

}