const COLOR_HEADER =
    "FF202020";


const COLOR_TEXTO_HEADER =
    "FFFFFFFF";


const FORMATO_MONEDA =
    '"$" #,##0.00';


const FORMATO_PORCENTAJE =
    '0.00"%"';


function ajustarColumnas(
    hoja
) {

    hoja.columns.forEach(
        (columna) => {

            let ancho =
                10;


            columna.eachCell(
                {
                    includeEmpty:
                        true
                },

                (celda) => {

                    const largo =
                        String(
                            celda.value ??
                            ""
                        ).length;


                    ancho =
                        Math.max(
                            ancho,
                            Math.min(
                                largo + 2,
                                35
                            )
                        );

                }
            );


            columna.width =
                ancho;

        }
    );

}


function estilizarEncabezado(
    fila
) {

    fila.font = {
        bold: true,
        color:
            {
                argb:
                    COLOR_TEXTO_HEADER
            }
    };


    fila.fill = {
        type:
            "pattern",

        pattern:
            "solid",

        fgColor:
            {
                argb:
                    COLOR_HEADER
            }
    };


    fila.alignment = {
        vertical:
            "middle"
    };

}


function crearHojaTabla(
    workbook,
    {
        nombre,
        columnas,
        filas
    }
) {

    const hoja =
        workbook.addWorksheet(
            nombre
        );


    hoja.columns =
        columnas.map(
            (columna) => ({

                header:
                    columna.header,

                key:
                    columna.key,

                width:
                    columna.width ||
                    15

            })
        );


    estilizarEncabezado(
        hoja.getRow(1)
    );


    for (
        const fila
        of filas
    ) {

        hoja.addRow(
            fila
        );

    }


    hoja.views = [
        {
            state:
                "frozen",

            ySplit:
                1
        }
    ];


    hoja.autoFilter = {
        from:
            {
                row: 1,
                column: 1
            },

        to:
            {
                row: 1,
                column:
                    columnas.length
            }
    };


    ajustarColumnas(
        hoja
    );


    return hoja;

}


function aplicarMoneda(
    hoja,
    columnas
) {

    for (
        const columna
        of columnas
    ) {

        hoja
            .getColumn(
                columna
            )
            .numFmt =
            FORMATO_MONEDA;

    }

}


function aplicarPorcentaje(
    hoja,
    columnas
) {

    for (
        const columna
        of columnas
    ) {

        hoja
            .getColumn(
                columna
            )
            .numFmt =
            FORMATO_PORCENTAJE;

    }

}


export async function exportarReportesExcel({
    filePath,
    datos,
    desde,
    hasta
}) {

    /*
     * Import dinámico.
     *
     * ExcelJS no ocupa memoria al
     * iniciar la aplicación.
     */

    const modulo =
        await import(
            "exceljs"
        );


    const ExcelJS =
        modulo.default ||
        modulo;


    const workbook =
        new ExcelJS.Workbook();


    workbook.creator =
        "Anotador de Vicios";


    workbook.created =
        new Date();


    /*
     * RESUMEN
     */

    const resumen =
        datos.resumen ||
        {};


    const hojaResumen =
        crearHojaTabla(
            workbook,
            {
                nombre:
                    "Resumen",

                columnas: [
                    {
                        header:
                            "Métrica",

                        key:
                            "metrica"
                    },

                    {
                        header:
                            "Valor",

                        key:
                            "valor"
                    }
                ],

                filas: [
                    {
                        metrica:
                            "Período",

                        valor:
                            `${desde} al ${hasta}`
                    },

                    {
                        metrica:
                            "Facturación",

                        valor:
                            resumen.facturacion ||
                            0
                    },

                    {
                        metrica:
                            "Ventas",

                        valor:
                            resumen.total_ventas ||
                            0
                    },

                    {
                        metrica:
                            "Ticket promedio",

                        valor:
                            resumen.ticket_promedio ||
                            0
                    },

                    {
                        metrica:
                            "Unidades vendidas",

                        valor:
                            resumen.unidades ||
                            0
                    },

                    {
                        metrica:
                            "Costo vendido",

                        valor:
                            resumen.costo_vendido ||
                            0
                    },

                    {
                        metrica:
                            "Margen bruto",

                        valor:
                            resumen.margen_bruto ||
                            0
                    },

                    {
                        metrica:
                            "Margen bruto %",

                        valor:
                            resumen.margen_porcentaje ||
                            0
                    },

                    {
                        metrica:
                            "Gastos",

                        valor:
                            resumen.gastos ||
                            0
                    },

                    {
                        metrica:
                            "Resultado operativo",

                        valor:
                            resumen.resultado_operativo ||
                            0
                    },

                    {
                        metrica:
                            "Movimiento neto caja",

                        valor:
                            resumen.movimiento_neto_caja ||
                            0
                    }
                ]
            }
        );


    const filasMoneda =
        [
            3,
            5,
            7,
            8,
            10,
            11,
            12
        ];


    for (
        const numeroFila
        of filasMoneda
    ) {

        hojaResumen
            .getCell(
                numeroFila,
                2
            )
            .numFmt =
            FORMATO_MONEDA;

    }


    hojaResumen
        .getCell(
            9,
            2
        )
        .numFmt =
        FORMATO_PORCENTAJE;


    /*
     * BALANCE
     */

    const hojaBalance =
        crearHojaTabla(
            workbook,
            {
                nombre:
                    "Balance mensual",

                columnas: [
                    {
                        header:
                            "Mes",

                        key:
                            "mes"
                    },

                    {
                        header:
                            "Ventas",

                        key:
                            "ventas"
                    },

                    {
                        header:
                            "Margen bruto",

                        key:
                            "margen"
                    },

                    {
                        header:
                            "Gastos",

                        key:
                            "gastos"
                    },

                    {
                        header:
                            "Resultado",

                        key:
                            "resultado"
                    },

                    {
                        header:
                            "Compras",

                        key:
                            "compras"
                    }
                ],

                filas:
                    (
                        datos
                            .balance_mensual ||
                        []
                    )
                        .map(
                            (item) => ({

                                mes:
                                    item.mes,

                                ventas:
                                    item.ventas,

                                margen:
                                    item.margen_bruto,

                                gastos:
                                    item.gastos,

                                resultado:
                                    item.resultado,

                                compras:
                                    item.compras

                            })
                        )
            }
        );


    aplicarMoneda(
        hojaBalance,
        [
            2,
            3,
            4,
            5,
            6
        ]
    );


    /*
     * PRODUCTOS
     */

    const hojaProductos =
        crearHojaTabla(
            workbook,
            {
                nombre:
                    "Productos",

                columnas: [
                    {
                        header:
                            "Producto",

                        key:
                            "producto"
                    },

                    {
                        header:
                            "Unidades",

                        key:
                            "unidades"
                    },

                    {
                        header:
                            "Facturación",

                        key:
                            "facturacion"
                    },

                    {
                        header:
                            "Margen",

                        key:
                            "margen"
                    },

                    {
                        header:
                            "Hora pico",

                        key:
                            "hora"
                    }
                ],

                filas:
                    (
                        datos
                            .productos_top ||
                        []
                    )
                        .map(
                            (item) => ({

                                producto:
                                    item.nombre,

                                unidades:
                                    item.unidades,

                                facturacion:
                                    item.facturacion,

                                margen:
                                    item.margen_bruto,

                                hora:
                                    item.hora_pico !==
                                    null
                                        ? `${String(
                                            item.hora_pico
                                        )
                                            .padStart(
                                                2,
                                                "0"
                                            )}:00`
                                        : ""

                            })
                        )
            }
        );


    aplicarMoneda(
        hojaProductos,
        [
            3,
            4
        ]
    );


    /*
     * HORARIOS
     */

    const hojaHorarios =
        crearHojaTabla(
            workbook,
            {
                nombre:
                    "Ventas por hora",

                columnas: [
                    {
                        header:
                            "Hora",

                        key:
                            "hora"
                    },

                    {
                        header:
                            "Ventas",

                        key:
                            "ventas"
                    },

                    {
                        header:
                            "Unidades",

                        key:
                            "unidades"
                    },

                    {
                        header:
                            "Facturación",

                        key:
                            "facturacion"
                    }
                ],

                filas:
                    (
                        datos
                            .ventas_por_hora ||
                        []
                    )
                        .map(
                            (item) => ({

                                hora:
                                    `${String(
                                        item.hora
                                    )
                                        .padStart(
                                            2,
                                            "0"
                                        )}:00`,

                                ventas:
                                    item.tickets,

                                unidades:
                                    item.unidades,

                                facturacion:
                                    item.facturacion

                            })
                        )
            }
        );


    aplicarMoneda(
        hojaHorarios,
        [
            4
        ]
    );


    /*
     * CATEGORÍAS
     */

    const hojaCategorias =
        crearHojaTabla(
            workbook,
            {
                nombre:
                    "Categorías",

                columnas: [
                    {
                        header:
                            "Categoría",

                        key:
                            "categoria"
                    },

                    {
                        header:
                            "Unidades",

                        key:
                            "unidades"
                    },

                    {
                        header:
                            "Facturación",

                        key:
                            "facturacion"
                    },

                    {
                        header:
                            "Margen",

                        key:
                            "margen"
                    },

                    {
                        header:
                            "Margen %",

                        key:
                            "margenPct"
                    }
                ],

                filas:
                    (
                        datos
                            .categorias_top ||
                        []
                    )
                        .map(
                            (item) => ({

                                categoria:
                                    item.categoria,

                                unidades:
                                    item.unidades,

                                facturacion:
                                    item.facturacion,

                                margen:
                                    item.margen_bruto,

                                margenPct:
                                    item.margen_porcentaje

                            })
                        )
            }
        );


    aplicarMoneda(
        hojaCategorias,
        [
            3,
            4
        ]
    );


    aplicarPorcentaje(
        hojaCategorias,
        [
            5
        ]
    );


    /*
     * RENTABILIDAD
     */

    const hojaMargenes =
        crearHojaTabla(
            workbook,
            {
                nombre:
                    "Rentabilidad",

                columnas: [
                    {
                        header:
                            "Producto",

                        key:
                            "producto"
                    },

                    {
                        header:
                            "Unidades",

                        key:
                            "unidades"
                    },

                    {
                        header:
                            "Facturación",

                        key:
                            "facturacion"
                    },

                    {
                        header:
                            "Costo",

                        key:
                            "costo"
                    },

                    {
                        header:
                            "Margen",

                        key:
                            "margen"
                    },

                    {
                        header:
                            "Margen %",

                        key:
                            "margenPct"
                    }
                ],

                filas:
                    (
                        datos
                            .margen_productos ||
                        []
                    )
                        .map(
                            (item) => ({

                                producto:
                                    item.nombre,

                                unidades:
                                    item.unidades,

                                facturacion:
                                    item.facturacion,

                                costo:
                                    item.costo,

                                margen:
                                    item.margen_bruto,

                                margenPct:
                                    item.margen_porcentaje

                            })
                        )
            }
        );


    aplicarMoneda(
        hojaMargenes,
        [
            3,
            4,
            5
        ]
    );


    aplicarPorcentaje(
        hojaMargenes,
        [
            6
        ]
    );


    /*
     * MÉTODOS DE PAGO
     */

    const hojaMetodos =
        crearHojaTabla(
            workbook,
            {
                nombre:
                    "Métodos de pago",

                columnas: [
                    {
                        header:
                            "Método",

                        key:
                            "metodo"
                    },

                    {
                        header:
                            "Ventas",

                        key:
                            "ventas"
                    },

                    {
                        header:
                            "Total",

                        key:
                            "total"
                    },

                    {
                        header:
                            "Participación %",

                        key:
                            "porcentaje"
                    }
                ],

                filas:
                    (
                        datos
                            .metodos_pago ||
                        []
                    )
                        .map(
                            (item) => ({

                                metodo:
                                    item.metodo_pago,

                                ventas:
                                    item.ventas,

                                total:
                                    item.total,

                                porcentaje:
                                    item.porcentaje

                            })
                        )
            }
        );


    aplicarMoneda(
        hojaMetodos,
        [
            3
        ]
    );


    aplicarPorcentaje(
        hojaMetodos,
        [
            4
        ]
    );


    /*
     * STOCK SIN ROTACIÓN
     */

    const hojaSinRotacion =
        crearHojaTabla(
            workbook,
            {
                nombre:
                    "Sin rotación",

                columnas: [
                    {
                        header:
                            "Producto",

                        key:
                            "producto"
                    },

                    {
                        header:
                            "Código",

                        key:
                            "codigo"
                    },

                    {
                        header:
                            "Stock",

                        key:
                            "stock"
                    },

                    {
                        header:
                            "Costo",

                        key:
                            "costo"
                    },

                    {
                        header:
                            "Capital inmovilizado",

                        key:
                            "capital"
                    }
                ],

                filas:
                    (
                        datos
                            .sin_rotacion ||
                        []
                    )
                        .map(
                            (item) => ({

                                producto:
                                    item.nombre,

                                codigo:
                                    item.codigo,

                                stock:
                                    item.stock_actual,

                                costo:
                                    item.costo,

                                capital:
                                    item.valor_stock

                            })
                        )
            }
        );


    aplicarMoneda(
        hojaSinRotacion,
        [
            4,
            5
        ]
    );


    /*
     * WRITEFILE devuelve Promise.
     *
     * Acá sí usamos await para no hacer
     * una escritura síncrona bloqueante.
     */

    await workbook
        .xlsx
        .writeFile(
            filePath
        );

}