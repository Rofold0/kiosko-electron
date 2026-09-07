import {
    useEffect,
    useMemo,
    useState
} from "react";

import PageHeader
    from "../components/pageHeader.jsx";


const moneda =
    new Intl.NumberFormat(
        "es-AR",
        {
            style: "currency",
            currency: "ARS"
        }
    );


const numero =
    new Intl.NumberFormat(
        "es-AR"
    );


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


function rangoInicial() {

    const hoy =
        new Date();


    const inicio =
        new Date(
            hoy.getFullYear(),
            hoy.getMonth(),
            1
        );


    return {

        desde:
            fechaTextoLocal(
                inicio
            ),

        hasta:
            fechaTextoLocal(
                hoy
            )

    };

}


function horaTexto(hora) {

    if (
        hora === null ||
        hora === undefined
    ) {

        return "—";

    }


    return `${String(hora)
        .padStart(
            2,
            "0"
        )}:00`;

}


function mesTexto(valor) {

    const fecha =
        new Date(
            `${valor}-01T00:00:00`
        );


    return new Intl
        .DateTimeFormat(
            "es-AR",
            {
                month: "short",
                year: "numeric"
            }
        )
        .format(fecha);

}
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


function diaTexto(
    numeroDia
) {

    return (
        DIAS[
        Number(numeroDia)
        ] ||
        "—"
    );

}


function porcentajeTexto(
    valor
) {

    if (
        valor === null ||
        valor === undefined
    ) {

        return "Nuevo";

    }


    const numero =
        Number(valor);


    return `${numero > 0
        ? "+"
        : ""
        }${numero.toFixed(1)}%`;

}

function Reportes() {

    const inicial =
        useMemo(
            rangoInicial,
            []
        );


    const [
        desde,
        setDesde
    ] = useState(
        inicial.desde
    );


    const [
        hasta,
        setHasta
    ] = useState(
        inicial.hasta
    );


    const [
        datos,
        setDatos
    ] = useState(null);


    const [
        cargando,
        setCargando
    ] = useState(true);


    const mostrarError =
        async (error) => {

            console.error(error);

            await window
                .electronAPI
                .dialogos
                .error(
                    error?.message ||
                    String(error)
                );

        };


    const cargar =
        async (
            rangoDesde = desde,
            rangoHasta = hasta
        ) => {

            setCargando(true);


            try {

                const resultado =
                    await window
                        .electronAPI
                        .reportes
                        .dashboard({

                            desde:
                                rangoDesde,

                            hasta:
                                rangoHasta

                        });


                setDatos(
                    resultado
                );


            } catch (error) {

                await mostrarError(
                    error
                );


            } finally {

                setCargando(false);

            }

        };


    useEffect(() => {

        cargar(
            inicial.desde,
            inicial.hasta
        );

    }, []);


    const aplicarRango =
        async (event) => {

            event.preventDefault();

            await cargar();

        };


    const maxHora =
        Math.max(
            1,
            ...(
                datos
                    ?.ventas_por_hora ||
                []
            )
                .map(
                    (item) =>
                        Number(
                            item.unidades
                        )
                )
        );


    const resumen =
        datos?.resumen;


    return (

        <div className="page reports-page">

            <PageHeader
                title="Reportes"
            />


            <form
                className="reports-filter"
                onSubmit={
                    aplicarRango
                }
            >

                <div className="form-field">

                    <label>
                        Desde
                    </label>

                    <input
                        type="date"
                        value={desde}
                        onChange={(event) =>
                            setDesde(
                                event.target.value
                            )
                        }
                    />

                </div>


                <div className="form-field">

                    <label>
                        Hasta
                    </label>

                    <input
                        type="date"
                        value={hasta}
                        onChange={(event) =>
                            setHasta(
                                event.target.value
                            )
                        }
                    />

                </div>


                <button
                    type="submit"
                    disabled={
                        cargando
                    }
                >
                    {
                        cargando
                            ? "Calculando..."
                            : "Actualizar"
                    }
                </button>

            </form>


            {!datos ? (

                <p>
                    {
                        cargando
                            ? "Calculando reportes..."
                            : "No hay datos."
                    }
                </p>

            ) : (

                <>

                    <div className="reports-summary">

                        <article className="report-stat">

                            <span>
                                Facturación
                            </span>

                            <strong>
                                {
                                    moneda.format(
                                        resumen
                                            .facturacion
                                    )
                                }
                            </strong>

                            <small>
                                {
                                    numero.format(
                                        resumen
                                            .total_ventas
                                    )
                                } ventas
                            </small>

                        </article>


                        <article className="report-stat">

                            <span>
                                Resultado operativo
                            </span>

                            <strong>
                                {
                                    moneda.format(
                                        resumen
                                            .resultado_operativo
                                    )
                                }
                            </strong>

                            <small>
                                margen − gastos
                            </small>

                        </article>


                        <article className="report-stat">

                            <span>
                                Ticket promedio
                            </span>

                            <strong>
                                {
                                    moneda.format(
                                        resumen
                                            .ticket_promedio
                                    )
                                }
                            </strong>

                        </article>


                        <article className="report-stat">

                            <span>
                                Unidades vendidas
                            </span>

                            <strong>
                                {
                                    numero.format(
                                        resumen
                                            .unidades
                                    )
                                }
                            </strong>

                        </article>


                        <article className="report-stat">

                            <span>
                                Horario pico
                            </span>

                            <strong>
                                {
                                    horaTexto(
                                        resumen
                                            .horario_pico
                                            ?.hora
                                    )
                                }
                            </strong>

                            <small>
                                {
                                    resumen
                                        .horario_pico
                                        ?.unidades ||
                                    0
                                } unidades
                            </small>

                        </article>


                        <article className="report-stat">

                            <span>
                                Movimiento neto caja
                            </span>

                            <strong>
                                {
                                    moneda.format(
                                        resumen
                                            .movimiento_neto_caja
                                    )
                                }
                            </strong>

                        </article>
                        <article className="report-stat">

                            <span>
                                Margen bruto
                            </span>

                            <strong>
                                {
                                    Number(
                                        resumen
                                            .margen_porcentaje
                                    )
                                        .toFixed(1)
                                }%
                            </strong>

                            <small>
                                {
                                    moneda.format(
                                        resumen
                                            .margen_bruto
                                    )
                                }
                            </small>

                        </article>


                        <article className="report-stat">

                            <span>
                                Día más fuerte
                            </span>

                            <strong>
                                {
                                    diaTexto(
                                        resumen
                                            .dia_fuerte
                                            ?.dia
                                    )
                                }
                            </strong>

                            <small>
                                {
                                    resumen
                                        .dia_fuerte
                                        ?.unidades ||
                                    0
                                } unidades
                            </small>

                        </article>


                        <article className="report-stat">

                            <span>
                                Categoría líder
                            </span>

                            <strong>
                                {
                                    resumen
                                        .categoria_lider
                                        ?.categoria ||
                                    "—"
                                }
                            </strong>

                            <small>
                                {
                                    resumen
                                        .categoria_lider
                                        ?.unidades ||
                                    0
                                } unidades
                            </small>

                        </article>

                        <article className="report-stat">

                            <span>
                                Vs. período anterior
                            </span>

                            <strong>
                                {
                                    porcentajeTexto(
                                        resumen
                                            .variacion_facturacion
                                    )
                                }
                            </strong>

                            <small>
                                facturación
                            </small>

                        </article>

                    </div>


                    {/* BALANCE */}

                    <section className="report-panel">

                        <div className="report-panel-header">

                            <div>

                                <h2>
                                    Balance mensual
                                </h2>

                                <p>
                                    Últimos 12 meses hasta el período seleccionado.
                                </p>

                            </div>

                        </div>


                        <div className="report-table-wrapper">

                            <table className="report-table">

                                <thead>

                                    <tr>
                                        <th>Mes</th>
                                        <th>Ventas</th>
                                        <th>Margen</th>
                                        <th>Gastos</th>
                                        <th>Resultado</th>
                                        <th>Compras</th>
                                    </tr>

                                </thead>


                                <tbody>

                                    {
                                        datos
                                            .balance_mensual
                                            .map(
                                                (item) => (

                                                    <tr
                                                        key={
                                                            item.mes
                                                        }
                                                    >

                                                        <td>
                                                            {
                                                                mesTexto(
                                                                    item.mes
                                                                )
                                                            }
                                                        </td>

                                                        <td>
                                                            {
                                                                moneda.format(
                                                                    item.ventas
                                                                )
                                                            }
                                                        </td>

                                                        <td>
                                                            {
                                                                moneda.format(
                                                                    item.margen_bruto
                                                                )
                                                            }
                                                        </td>

                                                        <td>
                                                            {
                                                                moneda.format(
                                                                    item.gastos
                                                                )
                                                            }
                                                        </td>

                                                        <td>
                                                            <strong>
                                                                {
                                                                    moneda.format(
                                                                        item.resultado
                                                                    )
                                                                }
                                                            </strong>
                                                        </td>

                                                        <td>
                                                            {
                                                                moneda.format(
                                                                    item.compras
                                                                )
                                                            }
                                                        </td>

                                                    </tr>

                                                )
                                            )
                                    }

                                </tbody>

                            </table>

                        </div>

                    </section>

                    <section className="report-panel">

                        <h2>
                            Comparativa con período anterior
                        </h2>

                        <p>
                            Compara el rango seleccionado con los mismos días inmediatamente anteriores.
                        </p>


                        <div className="report-compare-grid">

                            {[
                                {
                                    nombre:
                                        "Facturación",

                                    campo:
                                        "facturacion",

                                    formato:
                                        moneda.format
                                            .bind(moneda)
                                },

                                {
                                    nombre:
                                        "Ventas",

                                    campo:
                                        "ventas",

                                    formato:
                                        numero.format
                                            .bind(numero)
                                },

                                {
                                    nombre:
                                        "Unidades",

                                    campo:
                                        "unidades",

                                    formato:
                                        numero.format
                                            .bind(numero)
                                },

                                {
                                    nombre:
                                        "Margen",

                                    campo:
                                        "margen_bruto",

                                    formato:
                                        moneda.format
                                            .bind(moneda)
                                },

                                {
                                    nombre:
                                        "Gastos",

                                    campo:
                                        "gastos",

                                    formato:
                                        moneda.format
                                            .bind(moneda)
                                },

                                {
                                    nombre:
                                        "Resultado",

                                    campo:
                                        "resultado",

                                    formato:
                                        moneda.format
                                            .bind(moneda)
                                }

                            ].map(
                                (metrica) => (

                                    <article
                                        key={
                                            metrica.campo
                                        }
                                        className="report-compare-card"
                                    >

                                        <span>
                                            {
                                                metrica.nombre
                                            }
                                        </span>


                                        <strong>
                                            {
                                                metrica.formato(
                                                    datos
                                                        .comparativa
                                                        .actual[
                                                    metrica.campo
                                                    ] ||
                                                    0
                                                )
                                            }
                                        </strong>


                                        <small>
                                            Anterior:{" "}

                                            {
                                                metrica.formato(
                                                    datos
                                                        .comparativa
                                                        .anterior[
                                                    metrica.campo
                                                    ] ||
                                                    0
                                                )
                                            }
                                        </small>


                                        <b>
                                            {
                                                porcentajeTexto(
                                                    datos
                                                        .comparativa
                                                        .variacion[
                                                    metrica.campo
                                                    ]
                                                )
                                            }
                                        </b>

                                    </article>

                                )
                            )}

                        </div>

                    </section>

                    <section className="report-panel">

                        <h2>
                            Ventas por día de semana
                        </h2>


                        <div className="report-table-wrapper">

                            <table className="report-table">

                                <thead>

                                    <tr>
                                        <th>Día</th>
                                        <th>Ventas</th>
                                        <th>Unidades</th>
                                        <th>Facturación</th>
                                        <th>Ticket promedio</th>
                                    </tr>

                                </thead>


                                <tbody>

                                    {
                                        datos
                                            .ventas_por_dia
                                            .map(
                                                (item) => (

                                                    <tr
                                                        key={
                                                            item.dia
                                                        }
                                                    >

                                                        <td>
                                                            <strong>
                                                                {
                                                                    diaTexto(
                                                                        item.dia
                                                                    )
                                                                }
                                                            </strong>
                                                        </td>

                                                        <td>
                                                            {
                                                                item.tickets
                                                            }
                                                        </td>

                                                        <td>
                                                            {
                                                                numero.format(
                                                                    item.unidades
                                                                )
                                                            }
                                                        </td>

                                                        <td>
                                                            {
                                                                moneda.format(
                                                                    item.facturacion
                                                                )
                                                            }
                                                        </td>

                                                        <td>
                                                            {
                                                                moneda.format(
                                                                    item.ticket_promedio
                                                                )
                                                            }
                                                        </td>

                                                    </tr>

                                                )
                                            )
                                    }

                                </tbody>

                            </table>

                        </div>

                    </section>

                    <section className="report-panel">

                        <h2>
                            Categorías más vendidas
                        </h2>


                        <div className="report-table-wrapper">

                            <table className="report-table">

                                <thead>

                                    <tr>
                                        <th>Categoría</th>
                                        <th>Unidades</th>
                                        <th>Facturación</th>
                                        <th>Margen</th>
                                        <th>Margen %</th>
                                    </tr>

                                </thead>


                                <tbody>

                                    {
                                        datos
                                            .categorias_top
                                            .map(
                                                (item) => (

                                                    <tr
                                                        key={
                                                            item.categoria_id
                                                        }
                                                    >

                                                        <td>
                                                            {
                                                                item.categoria
                                                            }
                                                        </td>

                                                        <td>
                                                            {
                                                                numero.format(
                                                                    item.unidades
                                                                )
                                                            }
                                                        </td>

                                                        <td>
                                                            {
                                                                moneda.format(
                                                                    item.facturacion
                                                                )
                                                            }
                                                        </td>

                                                        <td>
                                                            {
                                                                moneda.format(
                                                                    item.margen_bruto
                                                                )
                                                            }
                                                        </td>

                                                        <td>
                                                            {
                                                                Number(
                                                                    item.margen_porcentaje
                                                                )
                                                                    .toFixed(1)
                                                            }%
                                                        </td>

                                                    </tr>

                                                )
                                            )
                                    }

                                </tbody>

                            </table>

                        </div>

                    </section>

                    <section className="report-panel">

                        <h2>
                            Productos que más margen generan
                        </h2>


                        <div className="report-table-wrapper">

                            <table className="report-table">

                                <thead>

                                    <tr>
                                        <th>Producto</th>
                                        <th>Unidades</th>
                                        <th>Facturación</th>
                                        <th>Costo</th>
                                        <th>Margen</th>
                                        <th>Margen %</th>
                                    </tr>

                                </thead>


                                <tbody>

                                    {
                                        datos
                                            .margen_productos
                                            .map(
                                                (item) => (

                                                    <tr
                                                        key={
                                                            item.producto_id
                                                        }
                                                    >

                                                        <td>
                                                            {
                                                                item.nombre
                                                            }
                                                        </td>

                                                        <td>
                                                            {
                                                                numero.format(
                                                                    item.unidades
                                                                )
                                                            }
                                                        </td>

                                                        <td>
                                                            {
                                                                moneda.format(
                                                                    item.facturacion
                                                                )
                                                            }
                                                        </td>

                                                        <td>
                                                            {
                                                                moneda.format(
                                                                    item.costo
                                                                )
                                                            }
                                                        </td>

                                                        <td>
                                                            <strong>
                                                                {
                                                                    moneda.format(
                                                                        item.margen_bruto
                                                                    )
                                                                }
                                                            </strong>
                                                        </td>

                                                        <td>
                                                            {
                                                                Number(
                                                                    item.margen_porcentaje
                                                                )
                                                                    .toFixed(1)
                                                            }%
                                                        </td>

                                                    </tr>

                                                )
                                            )
                                    }

                                </tbody>

                            </table>

                        </div>

                    </section>

                    <section className="report-panel">

                        <h2>
                            Rentabilidad en baja
                        </h2>

                        <p>
                            Productos cuyo margen porcentual bajó respecto del período anterior.
                        </p>


                        {
                            datos
                                .rentabilidad_cayendo
                                .length === 0
                                ? (

                                    <p>
                                        No se detectaron caídas significativas.
                                    </p>

                                )
                                : (

                                    <div className="report-table-wrapper">

                                        <table className="report-table">

                                            <thead>

                                                <tr>
                                                    <th>Producto</th>
                                                    <th>Margen anterior</th>
                                                    <th>Margen actual</th>
                                                    <th>Caída</th>
                                                    <th>Unidades actuales</th>
                                                </tr>

                                            </thead>


                                            <tbody>

                                                {
                                                    datos
                                                        .rentabilidad_cayendo
                                                        .map(
                                                            (item) => (

                                                                <tr
                                                                    key={
                                                                        item.producto_id
                                                                    }
                                                                >

                                                                    <td>
                                                                        {
                                                                            item.nombre
                                                                        }
                                                                    </td>

                                                                    <td>
                                                                        {
                                                                            Number(
                                                                                item.margen_pct_anterior
                                                                            )
                                                                                .toFixed(1)
                                                                        }%
                                                                    </td>

                                                                    <td>
                                                                        {
                                                                            Number(
                                                                                item.margen_pct_actual
                                                                            )
                                                                                .toFixed(1)
                                                                        }%
                                                                    </td>

                                                                    <td>
                                                                        <strong>
                                                                            {
                                                                                Number(
                                                                                    item.variacion_puntos
                                                                                )
                                                                                    .toFixed(1)
                                                                            } pp
                                                                        </strong>
                                                                    </td>

                                                                    <td>
                                                                        {
                                                                            numero.format(
                                                                                item.unidades_actual
                                                                            )
                                                                        }
                                                                    </td>

                                                                </tr>

                                                            )
                                                        )
                                                }

                                            </tbody>

                                        </table>

                                    </div>

                                )
                        }

                    </section>

                    {/* HORARIOS */}

                    <section className="report-panel">

                        <h2>
                            Horarios más vendidos
                        </h2>


                        <div className="report-hours">

                            {
                                datos
                                    .ventas_por_hora
                                    .map(
                                        (item) => (

                                            <div
                                                key={
                                                    item.hora
                                                }
                                                className="report-hour"
                                            >

                                                <strong>
                                                    {
                                                        horaTexto(
                                                            item.hora
                                                        )
                                                    }
                                                </strong>


                                                <div className="report-bar-track">

                                                    <div
                                                        className="report-bar"
                                                        style={{
                                                            width:
                                                                `${Math.max(
                                                                    3,
                                                                    (
                                                                        item.unidades /
                                                                        maxHora
                                                                    ) *
                                                                    100
                                                                )}%`
                                                        }}
                                                    />

                                                </div>


                                                <span>
                                                    {
                                                        numero.format(
                                                            item.unidades
                                                        )
                                                    } u
                                                </span>


                                                <span>
                                                    {
                                                        moneda.format(
                                                            item.facturacion
                                                        )
                                                    }
                                                </span>

                                            </div>

                                        )
                                    )
                            }

                        </div>

                    </section>


                    {/* PRODUCTOS */}

                    <section className="report-panel">

                        <h2>
                            Productos más vendidos
                        </h2>


                        <div className="report-table-wrapper">

                            <table className="report-table">

                                <thead>

                                    <tr>
                                        <th>Producto</th>
                                        <th>Unidades</th>
                                        <th>Facturación</th>
                                        <th>Margen</th>
                                        <th>Hora pico</th>
                                    </tr>

                                </thead>


                                <tbody>

                                    {
                                        datos
                                            .productos_top
                                            .map(
                                                (item) => (

                                                    <tr
                                                        key={
                                                            item.producto_id
                                                        }
                                                    >

                                                        <td>
                                                            {
                                                                item.nombre
                                                            }
                                                        </td>

                                                        <td>
                                                            {
                                                                numero.format(
                                                                    item.unidades
                                                                )
                                                            }
                                                        </td>

                                                        <td>
                                                            {
                                                                moneda.format(
                                                                    item.facturacion
                                                                )
                                                            }
                                                        </td>

                                                        <td>
                                                            {
                                                                moneda.format(
                                                                    item.margen_bruto
                                                                )
                                                            }
                                                        </td>

                                                        <td>
                                                            {
                                                                horaTexto(
                                                                    item.hora_pico
                                                                )
                                                            }

                                                            {
                                                                item.unidades_hora_pico
                                                                    ? ` · ${item.unidades_hora_pico} u`
                                                                    : ""
                                                            }
                                                        </td>

                                                    </tr>

                                                )
                                            )
                                    }

                                </tbody>

                            </table>

                        </div>

                    </section>


                    {/* MÉTODOS */}

                    <section className="report-panel">

                        <h2>
                            Métodos de pago
                        </h2>


                        <div className="report-methods">

                            {
                                datos
                                    .metodos_pago
                                    .map(
                                        (item) => (

                                            <article
                                                key={
                                                    item.metodo_pago
                                                }
                                                className="report-method"
                                            >

                                                <span>
                                                    {
                                                        item.metodo_pago
                                                    }
                                                </span>

                                                <strong>
                                                    {
                                                        moneda.format(
                                                            item.total
                                                        )
                                                    }
                                                </strong>

                                                <small>
                                                    {
                                                        Number(
                                                            item.porcentaje
                                                        )
                                                            .toFixed(
                                                                1
                                                            )
                                                    }%
                                                    {" · "}
                                                    {
                                                        item.ventas
                                                    } ventas
                                                </small>

                                            </article>

                                        )
                                    )
                            }

                        </div>

                    </section>


                    {/* SIN ROTACIÓN */}

                    <section className="report-panel">

                        <h2>
                            Stock sin rotación
                        </h2>

                        <p>
                            Productos con stock que no tuvieron ventas en el período.
                        </p>


                        <div className="report-table-wrapper">

                            <table className="report-table">

                                <thead>

                                    <tr>
                                        <th>Producto</th>
                                        <th>Stock</th>
                                        <th>Costo</th>
                                        <th>Capital inmovilizado</th>
                                    </tr>

                                </thead>


                                <tbody>

                                    {
                                        datos
                                            .sin_rotacion
                                            .map(
                                                (item) => (

                                                    <tr
                                                        key={
                                                            item.id
                                                        }
                                                    >

                                                        <td>
                                                            {
                                                                item.nombre
                                                            }
                                                        </td>

                                                        <td>
                                                            {
                                                                numero.format(
                                                                    item.stock_actual
                                                                )
                                                            }
                                                        </td>

                                                        <td>
                                                            {
                                                                moneda.format(
                                                                    item.costo
                                                                )
                                                            }
                                                        </td>

                                                        <td>
                                                            <strong>
                                                                {
                                                                    moneda.format(
                                                                        item.valor_stock
                                                                    )
                                                                }
                                                            </strong>
                                                        </td>

                                                    </tr>

                                                )
                                            )
                                    }

                                </tbody>

                            </table>

                        </div>

                    </section>

                </>

            )}

        </div>

    );

}


export default Reportes;