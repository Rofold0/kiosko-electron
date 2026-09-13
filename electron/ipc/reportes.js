import {
    BrowserWindow,
    dialog
} from "electron";
import {
    handleProtegido
} from "../security/ipcPermissions.js";
import {
    writeFile
} from "node:fs/promises";
import {
    obtenerDashboardReportes
} from "../database/repositories/reportesRepository.js";
import {
    auditar
} from "../security/audit.js";


const PATRON_FECHA =
    /^\d{4}-\d{2}-\d{2}$/;

const DIAS =
    [
        "Domingo",
        "Lunes",
        "Martes",
        "Miércoles",
        "Jueves",
        "Viernes",
        "Sábado"
    ];


function obtenerVentana(
    event
) {

    const ventana =
        BrowserWindow
            .fromWebContents(
                event.sender
            );


    if (!ventana) {

        throw new Error(
            "No se pudo identificar la ventana de Reportes."
        );

    }


    return ventana;

}


function validarFechasExportacion({
    desde,
    hasta
}) {

    fechaLocal(desde);
    fechaLocal(hasta);


    return {
        desde,
        hasta
    };

}

function campoCsv(
    valor
) {

    if (
        valor === null ||
        valor === undefined
    ) {
        return "\"\"";
    }


    let texto;


    if (
        typeof valor === "number" &&
        Number.isFinite(valor)
    ) {

        /*
         * Separador decimal argentino.
         * Como usamos ; para columnas,
         * Excel lo abre correctamente.
         */

        texto =
            String(valor)
                .replace(
                    ".",
                    ","
                );


    } else {

        texto =
            String(valor);

    }


    return `"${texto.replaceAll(
        "\"",
        "\"\""
    )}"`;

}


function filaCsv(
    valores
) {

    return valores
        .map(campoCsv)
        .join(";");

}


function agregarSeccion(
    lineas,
    titulo,
    columnas,
    filas
) {

    lineas.push(
        filaCsv([
            titulo
        ])
    );


    lineas.push(
        filaCsv(
            columnas
        )
    );


    for (
        const fila
        of filas
    ) {

        lineas.push(
            filaCsv(
                fila
            )
        );

    }


    lineas.push("");

}


function crearCsvReportes({
    datos,
    desde,
    hasta
}) {

    const lineas = [];


    const resumen =
        datos?.resumen ||
        {};


    lineas.push(
        filaCsv([
            "REPORTE GENERAL"
        ])
    );


    lineas.push(
        filaCsv([
            "Período",
            desde,
            hasta
        ])
    );


    lineas.push("");


    agregarSeccion(
        lineas,

        "RESUMEN",

        [
            "Métrica",
            "Valor"
        ],

        [
            [
                "Facturación",
                resumen.facturacion
            ],

            [
                "Ventas",
                resumen.total_ventas
            ],

            [
                "Ticket promedio",
                resumen.ticket_promedio
            ],

            [
                "Unidades vendidas",
                resumen.unidades
            ],

            [
                "Costo vendido",
                resumen.costo_vendido
            ],

            [
                "Margen bruto",
                resumen.margen_bruto
            ],

            [
                "Margen bruto %",
                resumen.margen_porcentaje
            ],

            [
                "Gastos",
                resumen.gastos
            ],

            [
                "Resultado operativo",
                resumen.resultado_operativo
            ],

            [
                "Movimiento neto caja",
                resumen.movimiento_neto_caja
            ],

            [
                "Efectivo neto",
                resumen.efectivo_neto
            ],

            [
                "Horario pico",
                resumen
                    .horario_pico
                    ?.hora ?? ""
            ],

            [
                "Día fuerte",
                DIAS[
                Number(
                    resumen
                        .dia_fuerte
                        ?.dia
                )
                ] || ""
            ],

            [
                "Categoría líder",
                resumen
                    .categoria_lider
                    ?.categoria || ""
            ]
        ]
    );


    agregarSeccion(
        lineas,

        "BALANCE MENSUAL",

        [
            "Mes",
            "Ventas",
            "Margen bruto",
            "Gastos",
            "Resultado",
            "Compras"
        ],

        (
            datos.balance_mensual ||
            []
        ).map(
            (item) => [

                item.mes,
                item.ventas,
                item.margen_bruto,
                item.gastos,
                item.resultado,
                item.compras

            ]
        )
    );


    agregarSeccion(
        lineas,

        "VENTAS POR HORA",

        [
            "Hora",
            "Ventas",
            "Unidades",
            "Facturación"
        ],

        (
            datos.ventas_por_hora ||
            []
        ).map(
            (item) => [

                `${String(
                    item.hora
                ).padStart(
                    2,
                    "0"
                )}:00`,

                item.tickets,
                item.unidades,
                item.facturacion

            ]
        )
    );


    agregarSeccion(
        lineas,

        "VENTAS POR DÍA",

        [
            "Día",
            "Ventas",
            "Unidades",
            "Facturación",
            "Ticket promedio"
        ],

        (
            datos.ventas_por_dia ||
            []
        ).map(
            (item) => [

                DIAS[
                Number(
                    item.dia
                )
                ] || item.dia,

                item.tickets,
                item.unidades,
                item.facturacion,
                item.ticket_promedio

            ]
        )
    );


    agregarSeccion(
        lineas,

        "PRODUCTOS MÁS VENDIDOS",

        [
            "Producto",
            "Unidades",
            "Facturación",
            "Margen",
            "Hora pico"
        ],

        (
            datos.productos_top ||
            []
        ).map(
            (item) => [

                item.nombre,
                item.unidades,
                item.facturacion,
                item.margen_bruto,
                item.hora_pico

            ]
        )
    );


    agregarSeccion(
        lineas,

        "CATEGORÍAS",

        [
            "Categoría",
            "Unidades",
            "Facturación",
            "Margen",
            "Margen %"
        ],

        (
            datos.categorias_top ||
            []
        ).map(
            (item) => [

                item.categoria,
                item.unidades,
                item.facturacion,
                item.margen_bruto,
                item.margen_porcentaje

            ]
        )
    );


    agregarSeccion(
        lineas,

        "MARGEN POR PRODUCTO",

        [
            "Producto",
            "Unidades",
            "Facturación",
            "Costo",
            "Margen",
            "Margen %"
        ],

        (
            datos.margen_productos ||
            []
        ).map(
            (item) => [

                item.nombre,
                item.unidades,
                item.facturacion,
                item.costo,
                item.margen_bruto,
                item.margen_porcentaje

            ]
        )
    );


    agregarSeccion(
        lineas,

        "MÉTODOS DE PAGO",

        [
            "Método",
            "Ventas",
            "Total",
            "Porcentaje"
        ],

        (
            datos.metodos_pago ||
            []
        ).map(
            (item) => [

                item.metodo_pago,
                item.ventas,
                item.total,
                item.porcentaje

            ]
        )
    );


    agregarSeccion(
        lineas,

        "STOCK SIN ROTACIÓN",

        [
            "Producto",
            "Código",
            "Stock",
            "Costo",
            "Capital inmovilizado"
        ],

        (
            datos.sin_rotacion ||
            []
        ).map(
            (item) => [

                item.nombre,
                item.codigo,
                item.stock_actual,
                item.costo,
                item.valor_stock

            ]
        )
    );


    agregarSeccion(
        lineas,

        "RENTABILIDAD EN BAJA",

        [
            "Producto",
            "Margen anterior %",
            "Margen actual %",
            "Variación pp",
            "Unidades actuales"
        ],

        (
            datos.rentabilidad_cayendo ||
            []
        ).map(
            (item) => [

                item.nombre,
                item.margen_pct_anterior,
                item.margen_pct_actual,
                item.variacion_puntos,
                item.unidades_actual

            ]
        )
    );


    /*
     * BOM UTF-8:
     * mejora apertura directa
     * desde Excel en Windows.
     */

    return (
        "\uFEFF" +
        lineas.join(
            "\r\n"
        )
    );

}

function fechaLocal(
    texto
) {

    if (
        !PATRON_FECHA.test(
            texto || ""
        )
    ) {

        throw new Error(
            "Fecha inválida."
        );

    }


    const fecha =
        new Date(
            `${texto}T00:00:00`
        );


    if (
        Number.isNaN(
            fecha.getTime()
        )
    ) {

        throw new Error(
            "Fecha inválida."
        );

    }


    return fecha;

}


function fechaTextoLocal(
    fecha
) {

    const year =
        fecha.getFullYear();


    const month =
        String(
            fecha.getMonth() + 1
        )
            .padStart(
                2,
                "0"
            );


    const day =
        String(
            fecha.getDate()
        )
            .padStart(
                2,
                "0"
            );


    return (
        `${year}-${month}-${day}`
    );

}


function prepararRango({
    desde,
    hasta
}) {

    const inicio =
        fechaLocal(desde);


    const fin =
        fechaLocal(hasta);


    if (
        inicio.getTime() >
        fin.getTime()
    ) {

        throw new Error(
            "La fecha desde no puede ser posterior a la fecha hasta."
        );

    }


    /*
     * Hasta exclusivo:
     * si el usuario selecciona 07/09,
     * incluimos todo el 07/09.
     */

    const finExclusivo =
        new Date(fin);

    const diasPeriodo =
        Math.round(
            (
                Date.UTC(
                    finExclusivo.getFullYear(),
                    finExclusivo.getMonth(),
                    finExclusivo.getDate()
                ) -
                Date.UTC(
                    inicio.getFullYear(),
                    inicio.getMonth(),
                    inicio.getDate()
                )
            ) /
            86400000
        );


    const anteriorHasta =
        new Date(inicio);


    const anteriorDesde =
        new Date(inicio);


    anteriorDesde.setDate(
        anteriorDesde.getDate() -
        diasPeriodo
    );

    finExclusivo.setDate(
        finExclusivo.getDate() +
        1
    );


    /*
     * Balance:
     * 12 meses terminando en
     * el mes seleccionado.
     */

    const inicioBalance =
        new Date(fin);


    inicioBalance.setDate(1);

    inicioBalance.setMonth(
        inicioBalance.getMonth() -
        11
    );


    return {

        desde:
            inicio.toISOString(),

        hasta:
            finExclusivo
                .toISOString(),

        anteriorDesde:
            anteriorDesde
                .toISOString(),

        anteriorHasta:
            anteriorHasta
                .toISOString(),

        balanceDesde:
            inicioBalance
                .toISOString(),

        mesInicial:
            fechaTextoLocal(
                inicioBalance
            )

    };

}


export function registerReportesHandlers() {

    handleProtegido(
        "reportes:dashboard",
        (
            _event,
            filtros = {}
        ) => {

            const rango =
                prepararRango({

                    desde:
                        filtros.desde,

                    hasta:
                        filtros.hasta

                });


            return obtenerDashboardReportes({

                ...rango,

                limiteProductos:
                    10

            });

        }
    );
    handleProtegido(
        "reportes:exportar-pdf",

        async (
            event,
            filtros = {}
        ) => {

            const {
                desde,
                hasta
            } =
                validarFechasExportacion(
                    filtros
                );


            const ventana =
                obtenerVentana(
                    event
                );


            const resultado =
                await dialog
                    .showSaveDialog(
                        ventana,
                        {
                            title:
                                "Exportar reporte a PDF",

                            defaultPath:
                                `reporte-${desde}-${hasta}.pdf`,

                            buttonLabel:
                                "Guardar PDF",

                            filters: [
                                {
                                    name:
                                        "Documento PDF",

                                    extensions:
                                        [
                                            "pdf"
                                        ]
                                }
                            ]
                        }
                    );


            if (
                resultado.canceled ||
                !resultado.filePath
            ) {

                return {
                    cancelado: true
                };

            }


            const pdf =
                await event
                    .sender
                    .printToPDF({

                        printBackground:
                            true,

                        pageSize:
                            "A4",

                        landscape:
                            true,

                        preferCSSPageSize:
                            true,

                        displayHeaderFooter:
                            false

                    });


            await writeFile(
                resultado.filePath,
                pdf
            );
            auditar(
                event,
                {
                    modulo:
                        "REPORTES",

                    accion:
                        "EXPORTAR_PDF",

                    descripcion:
                        "Reporte exportado a PDF.",

                    detalles: {
                        desde,
                        hasta
                    }
                }
            );

            return {
                cancelado: false
            };


        }
    );


    handleProtegido(
        "reportes:exportar-csv",

        async (
            event,
            payload = {}
        ) => {

            const {
                desde,
                hasta
            } =
                validarFechasExportacion(
                    payload
                );


            if (
                !payload.datos ||
                typeof payload.datos !==
                "object"
            ) {

                throw new Error(
                    "No hay datos de reportes para exportar."
                );

            }


            const ventana =
                obtenerVentana(
                    event
                );


            const resultado =
                await dialog
                    .showSaveDialog(
                        ventana,
                        {
                            title:
                                "Exportar reporte a CSV",

                            defaultPath:
                                `reporte-${desde}-${hasta}.csv`,

                            buttonLabel:
                                "Guardar CSV",

                            filters: [
                                {
                                    name:
                                        "Archivo CSV",

                                    extensions:
                                        [
                                            "csv"
                                        ]
                                }
                            ]
                        }
                    );


            if (
                resultado.canceled ||
                !resultado.filePath
            ) {

                return {
                    cancelado: true
                };

            }


            const csv =
                crearCsvReportes({

                    datos:
                        payload.datos,

                    desde,

                    hasta

                });


            await writeFile(
                resultado.filePath,
                csv,
                "utf8"
            );

            auditar(
                event,
                {
                    modulo:
                        "REPORTES",

                    accion:
                        "EXPORTAR_CSV",

                    descripcion:
                        "Reporte exportado a CSV.",

                    detalles: {
                        desde,
                        hasta
                    }
                }
            );
            return {
                cancelado: false
            };

        }
    );


    handleProtegido(
        "reportes:imprimir",

        async (
            event
        ) => {

            obtenerVentana(
                event
            );


            return new Promise(
                (
                    resolve,
                    reject
                ) => {

                    event
                        .sender
                        .print(
                            {
                                silent:
                                    false,

                                printBackground:
                                    true,

                                color:
                                    true,

                                landscape:
                                    true,

                                pageSize:
                                    "A4",

                                margins: {
                                    marginType:
                                        "default"
                                }
                            },

                            (
                                success,
                                failureReason
                            ) => {

                                if (success) {

                                    resolve({
                                        cancelado:
                                            false
                                    });
                                    auditar(
                                        event,
                                        {
                                            modulo:
                                                "REPORTES",

                                            accion:
                                                "IMPRIMIR",

                                            descripcion:
                                                "Reporte impreso.",

                                            detalles: {
                                                desde,
                                                hasta
                                            }
                                        }
                                    );
                                    return;

                                }


                                if (
                                    failureReason ===
                                    "Print job canceled"
                                ) {

                                    resolve({
                                        cancelado:
                                            true
                                    });

                                    return;

                                }


                                reject(
                                    new Error(
                                        failureReason ||
                                        "No se pudo imprimir el reporte."
                                    )
                                );

                            }
                        );

                }
            );

        }
    );
    handleProtegido(
        "reportes:exportar-excel",

        async (
            event,
            payload = {}
        ) => {

            const {
                desde,
                hasta
            } =
                validarFechasExportacion(
                    payload
                );


            if (
                !payload.datos ||
                typeof payload.datos !==
                "object"
            ) {

                throw new Error(
                    "No hay datos para exportar."
                );

            }


            const ventana =
                obtenerVentana(
                    event
                );


            const resultado =
                await dialog
                    .showSaveDialog(
                        ventana,
                        {
                            title:
                                "Exportar reporte a Excel",

                            defaultPath:
                                `reporte-${desde}-${hasta}.xlsx`,

                            buttonLabel:
                                "Guardar Excel",

                            filters: [
                                {
                                    name:
                                        "Libro de Excel",

                                    extensions: [
                                        "xlsx"
                                    ]
                                }
                            ]
                        }
                    );


            if (
                resultado.canceled ||
                !resultado.filePath
            ) {

                return {
                    cancelado: true
                };

            }


            /*
             * Cargamos nuestro servicio sólo
             * cuando realmente se necesita.
             */

            const {
                exportarReportesExcel
            } =
                await import(
                    "../services/reportesExcel.js"
                );


            await exportarReportesExcel({

                filePath:
                    resultado.filePath,

                datos:
                    payload.datos,

                desde,

                hasta

            });

            auditar(
                event,
                {
                    modulo:
                        "REPORTES",

                    accion:
                        "EXPORTAR_EXCEL",

                    descripcion:
                        "Reporte exportado a Excel",

                    detalles: {
                        desde,
                        hasta
                    }
                }
            );

            return {
                cancelado: false
            };

        }
    );

}