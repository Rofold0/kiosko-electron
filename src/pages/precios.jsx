import {
    useEffect,
    useState
} from "react";

import PageHeader
    from "../components/pageHeader.jsx";


const LIMITE = 50;


const moneda =
    new Intl.NumberFormat(
        "es-AR",
        {
            style: "currency",
            currency: "ARS"
        }
    );


function redondear(valor) {

    return Math.round(
        (
            Number(valor) +
            Number.EPSILON
        ) * 100
    ) / 100;

}


function textoNumero(valor) {

    if (
        !Number.isFinite(valor)
    ) {

        return "";
    }


    return String(
        redondear(valor)
    );

}


function numero(valor) {

    const resultado =
        Number(valor);


    return Number.isFinite(
        resultado
    )
        ? resultado
        : 0;

}


function calcularDesdePorcentaje(
    costo,
    porcentaje
) {

    const ganancia =
        redondear(
            costo *
            porcentaje /
            100
        );


    return {

        ganancia,

        precio:
            redondear(
                costo +
                ganancia
            )

    };

}


function calcularDesdeGanancia(
    costo,
    ganancia
) {

    return {

        porcentaje:
            costo === 0
                ? null
                : redondear(
                    ganancia /
                    costo *
                    100
                ),

        precio:
            redondear(
                costo +
                ganancia
            )

    };

}


function calcularDesdePrecio(
    costo,
    precio
) {

    const ganancia =
        redondear(
            precio -
            costo
        );


    return {

        ganancia,

        porcentaje:
            costo === 0
                ? null
                : redondear(
                    ganancia /
                    costo *
                    100
                )

    };

}


function Precios() {

    // LISTADO

    const [
        productos,
        setProductos
    ] = useState([]);

    const [
        busqueda,
        setBusqueda
    ] = useState("");

    const [
        busquedaActiva,
        setBusquedaActiva
    ] = useState("");

    const [
        pagina,
        setPagina
    ] = useState(1);

    const [
        totalPaginas,
        setTotalPaginas
    ] = useState(1);


    // PRODUCTO SELECCIONADO

    const [
        producto,
        setProducto
    ] = useState(null);

    const [
        costoReferencia,
        setCostoReferencia
    ] = useState(null);

    const [
        historial,
        setHistorial
    ] = useState([]);


    // FORMULARIO

    const [
        costo,
        setCosto
    ] = useState("");

    const [
        gananciaPorcentaje,
        setGananciaPorcentaje
    ] = useState("");

    const [
        gananciaValor,
        setGananciaValor
    ] = useState("");

    const [
        precioVenta,
        setPrecioVenta
    ] = useState("");


    /*
     * Determina qué valor queremos
     * conservar si después cambia
     * el costo.
     *
     * porcentaje
     * valor
     * precio
     */

    const [
        modoMargen,
        setModoMargen
    ] = useState(
        "porcentaje"
    );


    const [
        guardando,
        setGuardando
    ] = useState(false);


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


    const cargarListado =
        async (
            paginaNueva = pagina,
            texto =
                busquedaActiva
        ) => {

            const resultado =
                await window
                    .electronAPI
                    .precios
                    .listar({

                        busqueda:
                            texto,

                        pagina:
                            paginaNueva,

                        limite:
                            LIMITE

                    });


            setProductos(
                resultado.items
            );

            setPagina(
                resultado.pagina
            );

            setTotalPaginas(
                resultado.totalPaginas
            );

        };


    useEffect(() => {

        cargarListado(
            1,
            ""
        ).catch(
            mostrarError
        );

    }, []);


    const buscar =
        async (event) => {

            event.preventDefault();


            const texto =
                busqueda.trim();


            setBusquedaActiva(
                texto
            );


            try {

                await cargarListado(
                    1,
                    texto
                );


            } catch (error) {

                await mostrarError(
                    error
                );

            }

        };


    const aplicarValores =
        (
            costoNuevo,
            precioNuevo
        ) => {

            const c =
                redondear(
                    costoNuevo
                );

            const p =
                redondear(
                    precioNuevo
                );


            const calculo =
                calcularDesdePrecio(
                    c,
                    p
                );


            setCosto(
                textoNumero(c)
            );

            setPrecioVenta(
                textoNumero(p)
            );

            setGananciaValor(
                textoNumero(
                    calculo.ganancia
                )
            );

            setGananciaPorcentaje(
                calculo.porcentaje ===
                    null
                    ? ""
                    : textoNumero(
                        calculo.porcentaje
                    )
            );

        };


    const seleccionarProducto =
        async (item) => {

            try {

                const detalle =
                    await window
                        .electronAPI
                        .precios
                        .detalle(
                            item.producto_id
                        );


                setProducto(
                    detalle.producto
                );

                setCostoReferencia(
                    detalle.costo_referencia
                );

                setHistorial(
                    detalle.historial
                );


                if (detalle.vigente) {

                    aplicarValores(

                        detalle
                            .vigente
                            .costo,

                        detalle
                            .vigente
                            .precio_venta

                    );


                } else if (
                    detalle
                        .costo_referencia
                ) {

                    const costoInicial =
                        detalle
                            .costo_referencia
                            .costo_unitario;


                    aplicarValores(
                        costoInicial,
                        costoInicial
                    );


                } else {

                    aplicarValores(
                        0,
                        0
                    );

                }


                setModoMargen(
                    "porcentaje"
                );


            } catch (error) {

                await mostrarError(
                    error
                );

            }

        };


    /*
     * COSTO
     *
     * Si cambia, conservamos el
     * criterio que el usuario estaba
     * usando.
     */

    const cambiarCosto =
        (valor) => {

            setCosto(
                valor
            );


            const c =
                numero(valor);


            if (
                modoMargen ===
                "valor"
            ) {

                const g =
                    numero(
                        gananciaValor
                    );


                const resultado =
                    calcularDesdeGanancia(
                        c,
                        g
                    );


                setPrecioVenta(
                    textoNumero(
                        resultado.precio
                    )
                );


                setGananciaPorcentaje(
                    resultado.porcentaje ===
                        null
                        ? ""
                        : textoNumero(
                            resultado
                                .porcentaje
                        )
                );


            } else if (
                modoMargen ===
                "precio"
            ) {

                const p =
                    numero(
                        precioVenta
                    );


                const resultado =
                    calcularDesdePrecio(
                        c,
                        p
                    );


                setGananciaValor(
                    textoNumero(
                        resultado.ganancia
                    )
                );


                setGananciaPorcentaje(
                    resultado.porcentaje ===
                        null
                        ? ""
                        : textoNumero(
                            resultado
                                .porcentaje
                        )
                );


            } else {

                const porcentaje =
                    numero(
                        gananciaPorcentaje
                    );


                const resultado =
                    calcularDesdePorcentaje(
                        c,
                        porcentaje
                    );


                setGananciaValor(
                    textoNumero(
                        resultado.ganancia
                    )
                );


                setPrecioVenta(
                    textoNumero(
                        resultado.precio
                    )
                );

            }

        };


    /*
     * PORCENTAJE -> $
     */

    const cambiarPorcentaje =
        (valor) => {

            setModoMargen(
                "porcentaje"
            );

            setGananciaPorcentaje(
                valor
            );


            const resultado =
                calcularDesdePorcentaje(

                    numero(costo),

                    numero(valor)

                );


            setGananciaValor(
                textoNumero(
                    resultado.ganancia
                )
            );

            setPrecioVenta(
                textoNumero(
                    resultado.precio
                )
            );

        };


    /*
     * $ -> PORCENTAJE
     */

    const cambiarGananciaValor =
        (valor) => {

            setModoMargen(
                "valor"
            );

            setGananciaValor(
                valor
            );


            const resultado =
                calcularDesdeGanancia(

                    numero(costo),

                    numero(valor)

                );


            setGananciaPorcentaje(
                resultado.porcentaje ===
                    null
                    ? ""
                    : textoNumero(
                        resultado
                            .porcentaje
                    )
            );


            setPrecioVenta(
                textoNumero(
                    resultado.precio
                )
            );

        };


    /*
     * PRECIO FINAL -> AMBOS MÁRGENES
     */

    const cambiarPrecioVenta =
        (valor) => {

            setModoMargen(
                "precio"
            );

            setPrecioVenta(
                valor
            );


            const resultado =
                calcularDesdePrecio(

                    numero(costo),

                    numero(valor)

                );


            setGananciaValor(
                textoNumero(
                    resultado.ganancia
                )
            );


            setGananciaPorcentaje(
                resultado.porcentaje ===
                    null
                    ? ""
                    : textoNumero(
                        resultado
                            .porcentaje
                    )
            );

        };


    const usarUltimoCosto =
        () => {

            if (!costoReferencia) {
                return;
            }


            cambiarCosto(
                String(
                    costoReferencia
                        .costo_unitario
                )
            );

        };


    const refrescarDetalle =
        async () => {

            if (!producto) {
                return;
            }


            const detalle =
                await window
                    .electronAPI
                    .precios
                    .detalle(
                        producto.id
                    );


            setHistorial(
                detalle.historial
            );

            setCostoReferencia(
                detalle.costo_referencia
            );

        };


    const guardarPrecio =
        async () => {

            if (
                !producto ||
                guardando
            ) {

                return;
            }


            const costoNumero =
                Number(costo);

            const ventaNumero =
                Number(
                    precioVenta
                );


            if (
                !Number.isFinite(
                    costoNumero
                ) ||
                costoNumero < 0 ||
                !Number.isFinite(
                    ventaNumero
                ) ||
                ventaNumero < 0
            ) {

                await window
                    .electronAPI
                    .dialogos
                    .error(
                        "Revisá el costo y el precio de venta."
                    );

                return;
            }


            const confirmar =
                await window
                    .electronAPI
                    .dialogos
                    .confirmar(
                        `¿Guardar precio de ${producto.nombre} en ${moneda.format(ventaNumero)}?`
                    );


            if (!confirmar) {
                return;
            }


            setGuardando(true);


            try {

                await window
                    .electronAPI
                    .precios
                    .guardar({

                        producto_id:
                            producto.id,

                        costo:
                            costoNumero,

                        precio_venta:
                            ventaNumero

                    });


                await Promise.all([

                    refrescarDetalle(),

                    cargarListado(
                        pagina,
                        busquedaActiva
                    )

                ]);


            } catch (error) {

                await mostrarError(
                    error
                );


            } finally {

                setGuardando(false);

            }

        };


    const gananciaActual =
        numero(
            gananciaValor
        );


    return (

        <div className="page">

            <PageHeader
                title="Precios"
            />


            {/* BUSCADOR */}

            <form
                className="prices-search"
                onSubmit={buscar}
            >

                <div className="form-field">

                    <label>
                        Buscar producto
                    </label>

                    <input
                        value={busqueda}
                        onChange={(event) =>
                            setBusqueda(
                                event.target.value
                            )
                        }
                        placeholder=
                            "Nombre o código"
                    />

                </div>


                <button type="submit">
                    Buscar
                </button>

            </form>


            {/* LISTADO */}

            <div className="prices-layout">

                <section className="prices-products">

                    <h2>
                        Productos
                    </h2>


                    <div className="prices-product-list">

                        {productos.map(
                            (item) => (

                                <button
                                    key={
                                        item.producto_id
                                    }
                                    type="button"
                                    className={
                                        producto?.id ===
                                            item.producto_id
                                            ? "price-product price-product--selected"
                                            : "price-product"
                                    }
                                    onClick={() =>
                                        seleccionarProducto(
                                            item
                                        )
                                    }
                                >

                                    <span>

                                        <strong>
                                            {
                                                item.producto_nombre
                                            }
                                        </strong>

                                        {
                                            item.producto_codigo
                                                ? ` · ${item.producto_codigo}`
                                                : ""
                                        }

                                    </span>


                                    {
                                        item.precio_id
                                            ? (

                                                <strong>
                                                    {
                                                        moneda.format(
                                                            item.precio_venta
                                                        )
                                                    }
                                                </strong>

                                            )
                                            : (

                                                <span>
                                                    Sin precio
                                                </span>

                                            )
                                    }

                                </button>

                            )
                        )}

                    </div>


                    <div className="pagination">

                        <button
                            type="button"
                            disabled={
                                pagina <= 1
                            }
                            onClick={() =>
                                cargarListado(
                                    pagina - 1,
                                    busquedaActiva
                                )
                            }
                        >
                            ← Anterior
                        </button>


                        <span>
                            Página {pagina}
                            {" de "}
                            {totalPaginas}
                        </span>


                        <button
                            type="button"
                            disabled={
                                pagina >=
                                totalPaginas
                            }
                            onClick={() =>
                                cargarListado(
                                    pagina + 1,
                                    busquedaActiva
                                )
                            }
                        >
                            Siguiente →
                        </button>

                    </div>

                </section>


                {/* EDITOR */}

                <section className="price-editor">

                    {!producto ? (

                        <p>
                            Seleccioná un producto.
                        </p>

                    ) : (

                        <>

                            <h2>
                                {producto.nombre}
                            </h2>


                            {
                                producto.codigo && (

                                    <p>
                                        Código:{" "}
                                        {
                                            producto.codigo
                                        }
                                    </p>

                                )
                            }


                            {
                                costoReferencia && (

                                    <div className="price-reference">

                                        <div>

                                            <span>
                                                Última compra
                                            </span>

                                            <strong>
                                                {
                                                    moneda.format(
                                                        costoReferencia
                                                            .costo_unitario
                                                    )
                                                }
                                            </strong>

                                            <small>
                                                {
                                                    costoReferencia
                                                        .proveedor_nombre ||
                                                    "Proveedor"
                                                }
                                            </small>

                                        </div>


                                        <button
                                            type="button"
                                            onClick={
                                                usarUltimoCosto
                                            }
                                        >
                                            Usar este costo
                                        </button>

                                    </div>

                                )
                            }


                            <div className="price-grid">

                                <div className="form-field">

                                    <label>
                                        Costo $
                                    </label>

                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={costo}
                                        onChange={(event) =>
                                            cambiarCosto(
                                                event.target.value
                                            )
                                        }
                                    />

                                </div>


                                <div className="form-field">

                                    <label>
                                        Ganancia %
                                    </label>

                                    <input
                                        type="number"
                                        step="0.01"
                                        value={
                                            gananciaPorcentaje
                                        }
                                        onChange={(event) =>
                                            cambiarPorcentaje(
                                                event.target.value
                                            )
                                        }
                                        disabled={
                                            numero(costo) ===
                                            0
                                        }
                                    />

                                </div>


                                <div className="form-field">

                                    <label>
                                        Ganancia $
                                    </label>

                                    <input
                                        type="number"
                                        step="0.01"
                                        value={
                                            gananciaValor
                                        }
                                        onChange={(event) =>
                                            cambiarGananciaValor(
                                                event.target.value
                                            )
                                        }
                                    />

                                </div>


                                <div className="form-field price-sale-field">

                                    <label>
                                        Precio de venta $
                                    </label>

                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={
                                            precioVenta
                                        }
                                        onChange={(event) =>
                                            cambiarPrecioVenta(
                                                event.target.value
                                            )
                                        }
                                    />

                                </div>

                            </div>


                            <div
                                className={
                                    gananciaActual < 0
                                        ? "price-summary price-summary--loss"
                                        : "price-summary"
                                }
                            >

                                <span>
                                    Costo
                                    <strong>
                                        {
                                            moneda.format(
                                                numero(
                                                    costo
                                                )
                                            )
                                        }
                                    </strong>
                                </span>


                                <span>
                                    Ganancia
                                    <strong>
                                        {
                                            moneda.format(
                                                gananciaActual
                                            )
                                        }
                                    </strong>
                                </span>


                                <span>
                                    Porcentaje
                                    <strong>
                                        {
                                            gananciaPorcentaje ===
                                                ""
                                                ? "—"
                                                : `${gananciaPorcentaje}%`
                                        }
                                    </strong>
                                </span>


                                <span>
                                    Venta
                                    <strong>
                                        {
                                            moneda.format(
                                                numero(
                                                    precioVenta
                                                )
                                            )
                                        }
                                    </strong>
                                </span>

                            </div>


                            <button
                                type="button"
                                disabled={
                                    guardando
                                }
                                onClick={
                                    guardarPrecio
                                }
                            >
                                {
                                    guardando
                                        ? "Guardando..."
                                        : "Guardar nuevo precio"
                                }
                            </button>

                        </>

                    )}

                </section>

            </div>


            {/* HISTORIAL */}

            {producto && (

                <section className="price-history">

                    <h2>
                        Historial de precios
                    </h2>


                    <div className="price-history-wrapper">

                        <table className="price-history-table">

                            <thead>

                                <tr>
                                    <th>Desde</th>
                                    <th>Hasta</th>
                                    <th>Costo</th>
                                    <th>Ganancia $</th>
                                    <th>Ganancia %</th>
                                    <th>Venta</th>
                                </tr>

                            </thead>


                            <tbody>

                                {
                                    historial.length ===
                                    0 ? (

                                        <tr>

                                            <td
                                                colSpan="6"
                                            >
                                                Sin historial.
                                            </td>

                                        </tr>

                                    ) : (

                                        historial.map(
                                            (item) => (

                                                <tr
                                                    key={
                                                        item.id
                                                    }
                                                >

                                                    <td>
                                                        {
                                                            new Date(
                                                                item.fecha_desde
                                                            )
                                                                .toLocaleString(
                                                                    "es-AR"
                                                                )
                                                        }
                                                    </td>


                                                    <td>
                                                        {
                                                            item.fecha_hasta
                                                                ? new Date(
                                                                    item.fecha_hasta
                                                                )
                                                                    .toLocaleString(
                                                                        "es-AR"
                                                                    )
                                                                : "Vigente"
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
                                                        {
                                                            moneda.format(
                                                                item.ganancia_valor
                                                            )
                                                        }
                                                    </td>


                                                    <td>
                                                        {
                                                            item.ganancia_porcentaje ===
                                                                null
                                                                ? "—"
                                                                : `${item.ganancia_porcentaje}%`
                                                        }
                                                    </td>


                                                    <td>
                                                        <strong>
                                                            {
                                                                moneda.format(
                                                                    item.precio_venta
                                                                )
                                                            }
                                                        </strong>
                                                    </td>

                                                </tr>

                                            )
                                        )

                                    )
                                }

                            </tbody>

                        </table>

                    </div>

                </section>

            )}

        </div>

    );

}


export default Precios;