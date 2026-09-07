import {
    useEffect,
    useState
} from "react";

import PageHeader
    from "../components/pageHeader.jsx";


const LIMITE_HISTORIAL = 25;


const moneda =
    new Intl.NumberFormat(
        "es-AR",
        {
            style: "currency",
            currency: "ARS"
        }
    );


function fechaLocalActual() {

    const fecha =
        new Date();


    fecha.setMinutes(
        fecha.getMinutes() -
        fecha.getTimezoneOffset()
    );


    return fecha
        .toISOString()
        .slice(0, 16);

}


function Ventas() {

    // PRODUCTOS

    const [
        busqueda,
        setBusqueda
    ] = useState("");

    const [
        resultados,
        setResultados
    ] = useState([]);


    // CARRITO

    const [
        items,
        setItems
    ] = useState([]);


    // VENTA

    const [
        fecha,
        setFecha
    ] = useState(
        fechaLocalActual()
    );

    const [
        metodoPago,
        setMetodoPago
    ] = useState(
        "EFECTIVO"
    );

    const [
        notas,
        setNotas
    ] = useState("");

    const [
        guardando,
        setGuardando
    ] = useState(false);


    // HISTORIAL

    const [
        historial,
        setHistorial
    ] = useState([]);

    const [
        pagina,
        setPagina
    ] = useState(1);

    const [
        totalPaginas,
        setTotalPaginas
    ] = useState(1);

    const [
        ventaDetalle,
        setVentaDetalle
    ] = useState(null);


    // REVERSIÓN

    const [
        motivoReversion,
        setMotivoReversion
    ] = useState("");

    const [
        revirtiendo,
        setRevirtiendo
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


    const cargarProductos =
        async (
            texto = busqueda
        ) => {

            const productos =
                await window
                    .electronAPI
                    .ventas
                    .productos({

                        busqueda:
                            texto,

                        limite:
                            30

                    });


            setResultados(
                productos
            );

        };


    const cargarHistorial =
        async (
            paginaNueva = 1
        ) => {

            const resultado =
                await window
                    .electronAPI
                    .ventas
                    .listar({

                        pagina:
                            paginaNueva,

                        limite:
                            LIMITE_HISTORIAL

                    });


            setHistorial(
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

        const iniciar =
            async () => {

                try {

                    await Promise.all([

                        cargarProductos(
                            ""
                        ),

                        cargarHistorial(
                            1
                        )

                    ]);


                } catch (error) {

                    await mostrarError(
                        error
                    );

                }

            };


        iniciar();

    }, []);


    const buscar =
        async (event) => {

            event.preventDefault();


            try {

                await cargarProductos(
                    busqueda.trim()
                );


            } catch (error) {

                await mostrarError(
                    error
                );

            }

        };


    const agregarProducto =
        (producto) => {

            if (
                producto.stock_actual <= 0
            ) {

                return;

            }


            setItems(
                (actuales) => {

                    const existente =
                        actuales.find(
                            (item) =>
                                item.producto_id ===
                                producto.producto_id
                        );


                    if (existente) {

                        if (
                            existente.cantidad >=
                            producto.stock_actual
                        ) {

                            return actuales;

                        }


                        return actuales.map(
                            (item) =>
                                item.producto_id ===
                                    producto.producto_id
                                    ? {
                                        ...item,

                                        cantidad:
                                            item.cantidad +
                                            1
                                    }
                                    : item
                        );

                    }


                    return [
                        ...actuales,

                        {
                            producto_id:
                                producto.producto_id,

                            producto_nombre:
                                producto.producto_nombre,

                            producto_codigo:
                                producto.producto_codigo,

                            precio_id:
                                producto.precio_id,

                            costo_unitario:
                                producto.costo,

                            precio_unitario:
                                producto.precio_venta,

                            stock_actual:
                                producto.stock_actual,

                            cantidad:
                                1
                        }

                    ];

                }
            );

        };


    const cambiarCantidad =
        (
            productoId,
            valor
        ) => {

            setItems(
                (actuales) =>
                    actuales.map(
                        (item) => {

                            if (
                                item.producto_id !==
                                productoId
                            ) {

                                return item;

                            }


                            const cantidad =
                                Math.min(
                                    item.stock_actual,

                                    Math.max(
                                        1,
                                        Number(
                                            valor
                                        ) || 1
                                    )
                                );


                            return {
                                ...item,
                                cantidad
                            };

                        }
                    )
            );

        };


    const quitarProducto =
        (productoId) => {

            setItems(
                (actuales) =>
                    actuales.filter(
                        (item) =>
                            item.producto_id !==
                            productoId
                    )
            );

        };


    const total =
        items.reduce(
            (
                acumulado,
                item
            ) =>
                acumulado +
                item.precio_unitario *
                item.cantidad,
            0
        );


    const ganancia =
        items.reduce(
            (
                acumulado,
                item
            ) =>
                acumulado +
                (
                    item.precio_unitario -
                    item.costo_unitario
                ) *
                item.cantidad,
            0
        );


    const registrarVenta =
        async () => {

            if (
                items.length === 0 ||
                guardando
            ) {

                return;

            }


            const confirmar =
                await window
                    .electronAPI
                    .dialogos
                    .confirmar(
                        `¿Registrar venta por ${moneda.format(total)}?`
                    );


            if (!confirmar) {
                return;
            }


            setGuardando(true);


            try {

                const venta =
                    await window
                        .electronAPI
                        .ventas
                        .crear({

                            fecha,

                            metodo_pago:
                                metodoPago,

                            notas,

                            items:
                                items.map(
                                    (item) => ({

                                        producto_id:
                                            item.producto_id,

                                        precio_id:
                                            item.precio_id,

                                        cantidad:
                                            item.cantidad

                                    })
                                )

                        });


                setVentaDetalle(
                    venta
                );

                setItems([]);

                setNotas("");

                setFecha(
                    fechaLocalActual()
                );

                setMotivoReversion(
                    ""
                );


                await Promise.all([

                    cargarProductos(
                        busqueda.trim()
                    ),

                    cargarHistorial(
                        1
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


    const abrirVenta =
        async (id) => {

            try {

                const venta =
                    await window
                        .electronAPI
                        .ventas
                        .obtener(id);


                setVentaDetalle(
                    venta
                );

                setMotivoReversion(
                    ""
                );


            } catch (error) {

                await mostrarError(
                    error
                );

            }

        };


    const revertirVenta =
        async () => {

            if (
                !ventaDetalle ||
                ventaDetalle.estado !==
                    "ACTIVA" ||
                revirtiendo
            ) {

                return;

            }


            const motivo =
                motivoReversion.trim();


            if (
                motivo.length < 3
            ) {

                await window
                    .electronAPI
                    .dialogos
                    .error(
                        "Debe indicar el motivo."
                    );

                return;

            }


            const confirmar =
                await window
                    .electronAPI
                    .dialogos
                    .confirmar(
                        `¿Revertir la venta #${ventaDetalle.id}? El stock será devuelto y se generará el movimiento de caja inverso.`
                    );


            if (!confirmar) {
                return;
            }


            setRevirtiendo(true);


            try {

                const venta =
                    await window
                        .electronAPI
                        .ventas
                        .revertir({

                            id:
                                ventaDetalle.id,

                            motivo

                        });


                setVentaDetalle(
                    venta
                );

                setMotivoReversion(
                    ""
                );


                await Promise.all([

                    cargarProductos(
                        busqueda.trim()
                    ),

                    cargarHistorial(
                        1
                    )

                ]);


            } catch (error) {

                await mostrarError(
                    error
                );


            } finally {

                setRevirtiendo(false);

            }

        };


    return (

        <div className="page">

            <PageHeader
                title="Ventas"
            />


            <div className="sales-layout">

                {/* PRODUCTOS */}

                <section>

                    <h2>
                        Productos
                    </h2>


                    <form
                        className="sales-search"
                        onSubmit={buscar}
                    >

                        <input
                            value={busqueda}
                            onChange={(event) =>
                                setBusqueda(
                                    event.target.value
                                )
                            }
                            placeholder="Nombre o código"
                        />


                        <button type="submit">
                            Buscar
                        </button>

                    </form>


                    <div className="sales-products">

                        {resultados.map(
                            (producto) => (

                                <button
                                    key={
                                        producto.producto_id
                                    }
                                    type="button"
                                    disabled={
                                        producto.stock_actual <=
                                        0
                                    }
                                    onClick={() =>
                                        agregarProducto(
                                            producto
                                        )
                                    }
                                >

                                    <span>

                                        <strong>
                                            {
                                                producto.producto_nombre
                                            }
                                        </strong>

                                        {
                                            producto.producto_codigo
                                                ? ` · ${producto.producto_codigo}`
                                                : ""
                                        }

                                    </span>


                                    <span>
                                        Stock:{" "}
                                        {
                                            producto.stock_actual
                                        }
                                    </span>


                                    <strong>
                                        {
                                            moneda.format(
                                                producto.precio_venta
                                            )
                                        }
                                    </strong>

                                </button>

                            )
                        )}

                    </div>

                </section>


                {/* CARRITO */}

                <section>

                    <h2>
                        Venta actual
                    </h2>


                    <div className="sales-cart-wrapper">

                        <table className="sales-cart">

                            <thead>

                                <tr>
                                    <th>Producto</th>
                                    <th>Cant.</th>
                                    <th>Precio</th>
                                    <th>Subtotal</th>
                                    <th></th>
                                </tr>

                            </thead>


                            <tbody>

                                {items.length === 0 ? (

                                    <tr>
                                        <td colSpan="5">
                                            No hay productos.
                                        </td>
                                    </tr>

                                ) : (

                                    items.map(
                                        (item) => (

                                            <tr
                                                key={
                                                    item.producto_id
                                                }
                                            >

                                                <td>
                                                    {
                                                        item.producto_nombre
                                                    }
                                                </td>


                                                <td>

                                                    <input
                                                        type="number"
                                                        min="1"
                                                        max={
                                                            item.stock_actual
                                                        }
                                                        step="1"
                                                        value={
                                                            item.cantidad
                                                        }
                                                        onChange={(event) =>
                                                            cambiarCantidad(
                                                                item.producto_id,
                                                                event.target.value
                                                            )
                                                        }
                                                    />

                                                </td>


                                                <td>
                                                    {
                                                        moneda.format(
                                                            item.precio_unitario
                                                        )
                                                    }
                                                </td>


                                                <td>
                                                    {
                                                        moneda.format(
                                                            item.precio_unitario *
                                                            item.cantidad
                                                        )
                                                    }
                                                </td>


                                                <td>

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            quitarProducto(
                                                                item.producto_id
                                                            )
                                                        }
                                                    >
                                                        Quitar
                                                    </button>

                                                </td>

                                            </tr>

                                        )
                                    )

                                )}

                            </tbody>

                        </table>

                    </div>


                    <div className="sales-summary">

                        <span>
                            Total
                            <strong>
                                {
                                    moneda.format(
                                        total
                                    )
                                }
                            </strong>
                        </span>


                        <span>
                            Ganancia estimada
                            <strong>
                                {
                                    moneda.format(
                                        ganancia
                                    )
                                }
                            </strong>
                        </span>

                    </div>


                    <div className="sales-fields">

                        <div className="form-field">

                            <label>
                                Método de pago
                            </label>

                            <select
                                value={
                                    metodoPago
                                }
                                onChange={(event) =>
                                    setMetodoPago(
                                        event.target.value
                                    )
                                }
                            >
                                <option value="EFECTIVO">
                                    Efectivo
                                </option>

                                <option value="TRANSFERENCIA">
                                    Transferencia
                                </option>

                                <option value="DEBITO">
                                    Débito
                                </option>

                                <option value="CREDITO">
                                    Crédito
                                </option>

                                <option value="QR">
                                    QR
                                </option>

                                <option value="OTRO">
                                    Otro
                                </option>
                            </select>

                        </div>


                        <div className="form-field">

                            <label>
                                Fecha
                            </label>

                            <input
                                type="datetime-local"
                                value={fecha}
                                onChange={(event) =>
                                    setFecha(
                                        event.target.value
                                    )
                                }
                            />

                        </div>

                    </div>


                    <div className="form-field">

                        <label>
                            Notas
                        </label>

                        <textarea
                            rows="3"
                            value={notas}
                            onChange={(event) =>
                                setNotas(
                                    event.target.value
                                )
                            }
                        />

                    </div>


                    <button
                        type="button"
                        disabled={
                            items.length === 0 ||
                            guardando
                        }
                        onClick={
                            registrarVenta
                        }
                    >
                        {
                            guardando
                                ? "Registrando..."
                                : "Registrar venta"
                        }
                    </button>

                </section>

            </div>


            {/* HISTORIAL */}

            <section className="sales-history">

                <h2>
                    Historial de ventas
                </h2>


                {historial.map(
                    (venta) => (

                        <button
                            key={
                                venta.id
                            }
                            type="button"
                            onClick={() =>
                                abrirVenta(
                                    venta.id
                                )
                            }
                        >

                            <span>
                                #{venta.id}
                                {" · "}
                                {venta.metodo_pago}
                                {" · "}
                                {venta.estado}
                            </span>


                            <span>
                                {
                                    new Date(
                                        venta.fecha
                                    )
                                        .toLocaleString(
                                            "es-AR"
                                        )
                                }
                            </span>


                            <strong>
                                {
                                    moneda.format(
                                        venta.total
                                    )
                                }
                            </strong>

                        </button>

                    )
                )}


                <div className="pagination">

                    <button
                        type="button"
                        disabled={
                            pagina <= 1
                        }
                        onClick={() =>
                            cargarHistorial(
                                pagina - 1
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
                            cargarHistorial(
                                pagina + 1
                            )
                        }
                    >
                        Siguiente →
                    </button>

                </div>

            </section>


            {/* DETALLE */}

            {ventaDetalle && (

                <section className="sale-detail">

                    <h2>
                        Venta #{ventaDetalle.id}
                    </h2>


                    <p>
                        Estado:{" "}
                        <strong>
                            {
                                ventaDetalle.estado
                            }
                        </strong>
                    </p>


                    <p>
                        Método:{" "}
                        {
                            ventaDetalle.metodo_pago
                        }
                    </p>


                    <p>
                        Total:{" "}

                        <strong>
                            {
                                moneda.format(
                                    ventaDetalle.total
                                )
                            }
                        </strong>
                    </p>


                    <p>
                        Ganancia:{" "}

                        <strong>
                            {
                                moneda.format(
                                    ventaDetalle.ganancia
                                )
                            }
                        </strong>
                    </p>


                    <div className="sales-cart-wrapper">

                        <table className="sales-cart">

                            <thead>

                                <tr>
                                    <th>Producto</th>
                                    <th>Cantidad</th>
                                    <th>Costo</th>
                                    <th>Precio</th>
                                    <th>Ganancia</th>
                                </tr>

                            </thead>


                            <tbody>

                                {ventaDetalle.items.map(
                                    (item) => (

                                        <tr
                                            key={
                                                item.id
                                            }
                                        >

                                            <td>
                                                {
                                                    item.producto_nombre
                                                }
                                            </td>

                                            <td>
                                                {
                                                    item.cantidad
                                                }
                                            </td>

                                            <td>
                                                {
                                                    moneda.format(
                                                        item.costo_unitario
                                                    )
                                                }
                                            </td>

                                            <td>
                                                {
                                                    moneda.format(
                                                        item.precio_unitario
                                                    )
                                                }
                                            </td>

                                            <td>
                                                {
                                                    moneda.format(
                                                        item.ganancia
                                                    )
                                                }
                                            </td>

                                        </tr>

                                    )
                                )}

                            </tbody>

                        </table>

                    </div>


                    {ventaDetalle.estado ===
                        "REVERTIDA" && (

                        <div className="sale-reverted">

                            <p>
                                Revertida:{" "}

                                {
                                    new Date(
                                        ventaDetalle.fecha_reversion
                                    )
                                        .toLocaleString(
                                            "es-AR"
                                        )
                                }
                            </p>


                            <p>
                                Motivo:{" "}
                                {
                                    ventaDetalle.motivo_reversion
                                }
                            </p>

                        </div>

                    )}


                    {ventaDetalle.estado ===
                        "ACTIVA" && (

                        <div className="sale-reversal">

                            <h3>
                                Revertir venta
                            </h3>


                            <textarea
                                rows="3"
                                value={
                                    motivoReversion
                                }
                                onChange={(event) =>
                                    setMotivoReversion(
                                        event.target.value
                                    )
                                }
                                placeholder="Ej: venta cargada dos veces"
                            />


                            <button
                                type="button"
                                disabled={
                                    revirtiendo
                                }
                                onClick={
                                    revertirVenta
                                }
                            >
                                {
                                    revirtiendo
                                        ? "Revirtiendo..."
                                        : "Revertir venta"
                                }
                            </button>

                        </div>

                    )}

                </section>

            )}

        </div>

    );

}


export default Ventas;