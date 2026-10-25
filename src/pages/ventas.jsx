import {
    useEffect,
    useState
} from "react";

import {
    useAuth
} from "../auth/authContext.jsx";

import PageHeader
    from "../components/pageHeader.jsx";


const LIMITE_HISTORIAL = 25;

const COTIZACION_VACIA = {
    items: [],
    combos: [],
    total: 0,
    descuento_total: 0,
    ganancia: 0
};

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
        .slice(0, 19);

}

function descripcionCombo(
    combo
) {

    if (
        combo.modo_precio ===
        "PAGA_UNIDADES"
    ) {

        const unidades =
            combo.productos
                ?.[0]
                ?.cantidad;


        return (
            `Llevás ${unidades}, pagás ${combo.valor_regla}`
        );

    }


    if (
        combo.modo_precio ===
        "DESCUENTO_PORCENTAJE"
    ) {

        if (
            combo.alcance_descuento ===
            "ULTIMA_UNIDAD"
        ) {

            return (
                `${combo.valor_regla}% OFF en la última unidad`
            );

        }


        return (
            `${combo.valor_regla}% OFF`
        );

    }


    return "Precio promocional";

}

function Ventas() {

    const {
        puede
    } =
        useAuth();


    const puedeCrear =
        puede(
            "ventas.crear"
        );


    const puedeVer =
        puede(
            "ventas.ver"
        );


    const puedeRevertir =
        puede(
            "ventas.revertir"
        );

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

    const [
        cotizacion,
        setCotizacion
    ] = useState(
        COTIZACION_VACIA
    );

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
        efectivoRecibido,
        setEfectivoRecibido
    ] = useState("");

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
            texto = busqueda,
            fechaConsulta = fecha
        ) => {

            const productos =
                await window
                    .electronAPI
                    .ventas
                    .productos({

                        busqueda:
                            texto,

                        fecha:
                            fechaConsulta,

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

                    const tareas = [];


                    if (puedeCrear) {

                        tareas.push(
                            cargarProductos(
                                ""
                            )
                        );

                    }


                    if (puedeVer) {

                        tareas.push(
                            cargarHistorial(
                                1
                            )
                        );

                    }


                    await Promise.all(
                        tareas
                    );


                } catch (error) {

                    await mostrarError(
                        error
                    );

                }

            };


        iniciar();

    }, [
        puedeCrear,
        puedeVer
    ]);

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

                            precio_lista:
                                producto.precio_lista,

                            precio_unitario:
                                producto.precio_venta,


                            descuento_unitario:
                                producto.descuento_unitario,

                            oferta_id:
                                producto.oferta_id,

                            oferta_nombre:
                                producto.oferta_nombre,

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

    const descuentoTotal =
        Number(
            cotizacion.descuento_total ||
            0
        );

    const total =
        Number(
            cotizacion.total ||
            0
        );

    const efectivoNumero =
        efectivoRecibido === ""
            ? NaN
            : Number(
                efectivoRecibido
            );


    const pagoEfectivoValido =
        metodoPago !== "EFECTIVO" ||
        (
            Number.isFinite(
                efectivoNumero
            ) &&
            efectivoNumero >= total
        );


    const vuelto =
        metodoPago === "EFECTIVO" &&
            Number.isFinite(
                efectivoNumero
            )
            ? Math.max(
                0,
                Math.round(
                    (
                        efectivoNumero -
                        total +
                        Number.EPSILON
                    ) *
                    100
                ) / 100
            )
            : 0;


    const faltante =
        metodoPago === "EFECTIVO" &&
            Number.isFinite(
                efectivoNumero
            )
            ? Math.max(
                0,
                Math.round(
                    (
                        total -
                        efectivoNumero +
                        Number.EPSILON
                    ) *
                    100
                ) / 100
            )
            : 0;

    const ganancia =
        Number(
            cotizacion.ganancia ||
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

            if (
                metodoPago ===
                "EFECTIVO" &&
                !pagoEfectivoValido
            ) {

                await window
                    .electronAPI
                    .dialogos
                    .error(
                        efectivoRecibido === ""
                            ? "Ingrese el efectivo recibido."
                            : `El efectivo recibido no alcanza. Faltan ${moneda.format(
                                faltante
                            )}.`
                    );

                return;

            }

            const detallePago =
                metodoPago === "EFECTIVO"
                    ? (
                        `\nRecibido: ${moneda.format(
                            efectivoNumero
                        )}` +
                        `\nVuelto: ${moneda.format(
                            vuelto
                        )}`
                    )
                    : "";


            const confirmar =
                await window
                    .electronAPI
                    .dialogos
                    .confirmar(
                        `¿Registrar venta por ${moneda.format(
                            total
                        )}?${detallePago}`
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

                            efectivo_recibido:
                                metodoPago ===
                                    "EFECTIVO"
                                    ? Number(
                                        efectivoRecibido
                                    )
                                    : null,

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


                const tareas = [];


                if (puedeCrear) {

                    tareas.push(
                        cargarProductos(
                            busqueda.trim()
                        )
                    );

                }


                if (puedeVer) {

                    tareas.push(
                        cargarHistorial(
                            1
                        )
                    );

                }


                await Promise.all(
                    tareas
                );


            } catch (error) {

                await mostrarError(
                    error
                );


            } finally {

                setGuardando(false);

            }
            setEfectivoRecibido("");
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


                const tareas = [];


                if (puedeCrear) {

                    tareas.push(
                        cargarProductos(
                            busqueda.trim()
                        )
                    );

                }


                if (puedeVer) {

                    tareas.push(
                        cargarHistorial(
                            1
                        )
                    );

                }


                await Promise.all(
                    tareas
                );


            } catch (error) {

                await mostrarError(
                    error
                );


            } finally {

                setRevirtiendo(false);

            }

        };

    const recotizar =
        async (
            fechaNueva = fecha,
            itemsActuales = items
        ) => {

            if (
                itemsActuales.length ===
                0
            ) {

                setCotizacion(
                    COTIZACION_VACIA
                );

                return;

            }


            const resultado =
                await window
                    .electronAPI
                    .ventas
                    .cotizar({

                        fecha:
                            fechaNueva,

                        items:
                            itemsActuales
                                .map(
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


            setCotizacion(
                resultado
            );

        };
    useEffect(() => {

        if (!puedeCrear) {
            return;
        }


        recotizar(
            fecha,
            items
        )
            .catch(
                mostrarError
            );

    }, [
        items,
        fecha,
        puedeCrear
    ]);




    return (

        <div className="page">

            <PageHeader
                title="Ventas"
            />

            {puedeCrear && (
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
                                            {<div className="sale-product-price">

                                                {producto.oferta_id && (

                                                    <small className="sale-old-price">

                                                        {
                                                            moneda.format(
                                                                producto.precio_lista
                                                            )
                                                        }

                                                    </small>

                                                )}


                                                <strong>
                                                    {
                                                        moneda.format(
                                                            producto.precio_venta
                                                        )
                                                    }
                                                </strong>


                                                {producto.oferta_nombre && (

                                                    <small className="sale-offer-label">
                                                        {producto.oferta_nombre}
                                                    </small>

                                                )}

                                            </div>
                                            }
                                        </strong>

                                    </button>

                                )
                            )}

                        </div>

                    </section>


                    {/* CARRITO */}

                    <section>

                        <h3>
                            Productos cargados
                        </h3>

                        <div className="sales-cart-wrapper">

                            <table className="sales-cart">

                                <thead>

                                    <tr>
                                        <th>Producto</th>
                                        <th>Cant.</th>
                                        <th></th>
                                    </tr>

                                </thead>


                                <tbody>

                                    {items.length === 0 ? (

                                        <tr>
                                            <td colSpan="3">
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
                        {items.length > 0 && (

                            <>
                                <h3>
                                    Detalle de cobro
                                </h3>


                                <div className="sales-cart-wrapper">

                                    <table className="sales-cart">

                                        <thead>

                                            <tr>
                                                <th>Detalle</th>
                                                <th>Cant.</th>
                                                <th>Precio</th>
                                                <th>Subtotal</th>
                                            </tr>

                                        </thead>


                                        <tbody>

                                            {cotizacion.combos.map(
                                                (combo) => (

                                                    <tr
                                                        key={
                                                            `combo-${combo.combo_id}`
                                                        }
                                                        className="sale-combo-row"
                                                    >

                                                        <td>

                                                            <strong>
                                                                {
                                                                    combo.combo_nombre
                                                                }
                                                            </strong>
                                                            <small className="sale-offer-label">
                                                                {
                                                                    descripcionCombo(
                                                                        combo
                                                                    )
                                                                }
                                                            </small>

                                                            <small className="sale-combo-products">

                                                                {
                                                                    combo.productos
                                                                        .map(
                                                                            (producto) =>
                                                                                `${producto.producto_nombre} × ${producto.cantidad}`
                                                                        )
                                                                        .join(
                                                                            " + "
                                                                        )
                                                                }

                                                            </small>

                                                        </td>


                                                        <td>
                                                            {
                                                                combo.cantidad
                                                            }
                                                        </td>


                                                        <td>
                                                            {
                                                                moneda.format(
                                                                    combo.precio_unitario
                                                                )
                                                            }
                                                        </td>


                                                        <td>
                                                            <strong>
                                                                {
                                                                    moneda.format(
                                                                        combo.subtotal
                                                                    )
                                                                }
                                                            </strong>
                                                        </td>

                                                    </tr>

                                                )
                                            )}


                                            {cotizacion.items.map(
                                                (item) => (

                                                    <tr
                                                        key={
                                                            `producto-${item.producto_id}`
                                                        }
                                                    >

                                                        <td>

                                                            {
                                                                item.producto_nombre
                                                            }


                                                            {item.oferta_nombre && (

                                                                <small className="sale-offer-label">
                                                                    {
                                                                        item.oferta_nombre
                                                                    }
                                                                </small>

                                                            )}

                                                        </td>


                                                        <td>
                                                            {
                                                                item.cantidad
                                                            }
                                                        </td>


                                                        <td>

                                                            <div className="sale-line-price">

                                                                {item.oferta_id && (

                                                                    <small className="sale-old-price">

                                                                        {
                                                                            moneda.format(
                                                                                item.precio_lista
                                                                            )
                                                                        }

                                                                    </small>

                                                                )}


                                                                <strong>
                                                                    {
                                                                        moneda.format(
                                                                            item.precio_unitario
                                                                        )
                                                                    }
                                                                </strong>

                                                            </div>

                                                        </td>


                                                        <td>
                                                            {
                                                                moneda.format(
                                                                    item.subtotal
                                                                )
                                                            }
                                                        </td>

                                                    </tr>

                                                )
                                            )}

                                        </tbody>

                                    </table>

                                </div>
                            </>

                        )}

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

                            <span>

                                Descuentos

                                <strong>
                                    {
                                        moneda.format(
                                            descuentoTotal
                                        )
                                    }
                                </strong>

                            </span>

                        </div>


                        <div className="sales-fields">
                            {metodoPago ===
                                "EFECTIVO" && (

                                    <div className="sales-cash-payment">

                                        <div className="form-field">

                                            <label>
                                                Efectivo recibido
                                            </label>

                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={
                                                    efectivoRecibido
                                                }
                                                onChange={(event) =>
                                                    setEfectivoRecibido(
                                                        event.target.value
                                                    )
                                                }
                                                placeholder={
                                                    moneda.format(
                                                        total
                                                    )
                                                }
                                            />

                                        </div>


                                        <div className="sales-change-card">

                                            <span>
                                                Vuelto
                                            </span>

                                            <strong>
                                                {
                                                    moneda.format(
                                                        vuelto
                                                    )
                                                }
                                            </strong>


                                            {faltante > 0 && (

                                                <small>
                                                    Faltan{" "}
                                                    {
                                                        moneda.format(
                                                            faltante
                                                        )
                                                    }
                                                </small>

                                            )}

                                        </div>

                                    </div>

                                )}
                            <div className="form-field">

                                <label>
                                    Método de pago
                                </label>

                                <select
                                    value={
                                        metodoPago
                                    }
                                    onChange={(event) => {

                                        const metodo =
                                            event.target.value;


                                        setMetodoPago(
                                            metodo
                                        );


                                        if (
                                            metodo !==
                                            "EFECTIVO"
                                        ) {

                                            setEfectivoRecibido(
                                                ""
                                            );

                                        }

                                    }}
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
                                <div className="sale-date-field">
                                    <input
                                        type="datetime-local"
                                        step="1"
                                        value={fecha}
                                        onChange={async (event) => {

                                            const nuevaFecha =
                                                event.target.value;


                                            setFecha(
                                                nuevaFecha
                                            );


                                            try {

                                                await cargarProductos(
                                                    busqueda.trim(),
                                                    nuevaFecha
                                                );


                                            } catch (error) {

                                                await mostrarError(
                                                    error
                                                );

                                            }

                                        }}
                                    />
                                    <button
                                        type="button"
                                        onClick={async () => {

                                            const ahora =
                                                fechaLocalActual();


                                            setFecha(
                                                ahora
                                            );


                                            try {

                                                await cargarProductos(
                                                    busqueda.trim(),
                                                    ahora
                                                );


                                            } catch (error) {

                                                await mostrarError(
                                                    error
                                                );

                                            }

                                        }}
                                    >
                                        Ahora
                                    </button>
                                </div>

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
                                guardando ||
                                !pagoEfectivoValido
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
            )}


            {/* HISTORIAL */}
            {puedeVer && (
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
            )}

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

                    {ventaDetalle.metodo_pago ===
                        "EFECTIVO" &&
                        ventaDetalle
                            .efectivo_recibido !==
                        null && (

                            <>
                                <p>
                                    Efectivo recibido:{" "}

                                    <strong>
                                        {
                                            moneda.format(
                                                ventaDetalle
                                                    .efectivo_recibido
                                            )
                                        }
                                    </strong>
                                </p>


                                <p>
                                    Vuelto:{" "}

                                    <strong>
                                        {
                                            moneda.format(
                                                ventaDetalle
                                                    .vuelto ||
                                                0
                                            )
                                        }
                                    </strong>
                                </p>
                            </>

                        )}

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
                                {ventaDetalle.combos?.map(
                                    (combo) => (

                                        <tr
                                            key={
                                                `combo-${combo.id}`
                                            }
                                            className="sale-combo-row"
                                        >

                                            <td>

                                                <strong>
                                                    {
                                                        combo.combo_nombre
                                                    }
                                                </strong>


                                                <small className="sale-combo-products">

                                                    {
                                                        combo.productos
                                                            .map(
                                                                (producto) =>
                                                                    `${producto.producto_nombre} × ${producto.cantidad}`
                                                            )
                                                            .join(
                                                                " + "
                                                            )
                                                    }

                                                </small>

                                            </td>


                                            <td>
                                                {
                                                    combo.cantidad
                                                }
                                            </td>


                                            <td>
                                                {
                                                    moneda.format(
                                                        combo.costo_total
                                                    )
                                                }
                                            </td>


                                            <td>
                                                {
                                                    moneda.format(
                                                        combo.precio_unitario
                                                    )
                                                }
                                            </td>


                                            <td>
                                                {
                                                    moneda.format(
                                                        combo.ganancia
                                                    )
                                                }
                                            </td>

                                        </tr>

                                    )
                                )}
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


                    {puedeRevertir &&
                        ventaDetalle.estado ===
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