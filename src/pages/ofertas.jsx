import {
    useEffect,
    useMemo,
    useState
} from "react";

import {
    useAuth
} from "../auth/authContext.jsx";

import PageHeader
    from "../components/pageHeader.jsx";

import "../styles/ofertas.css";


const moneda =
    new Intl.NumberFormat(
        "es-AR",
        {
            style:
                "currency",

            currency:
                "ARS"
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


function numero(valor) {

    const resultado =
        Number(valor);


    return Number.isFinite(
        resultado
    )
        ? resultado
        : 0;

}


function textoNumero(valor) {

    if (
        !Number.isFinite(
            valor
        )
    ) {

        return "";

    }


    return String(
        redondear(
            valor
        )
    );

}


function fechaLocal(
    horasExtra = 0
) {

    const fecha =
        new Date();


    fecha.setHours(
        fecha.getHours() +
        horasExtra
    );


    fecha.setMinutes(
        fecha.getMinutes() -
        fecha.getTimezoneOffset()
    );


    return fecha
        .toISOString()
        .slice(
            0,
            16
        );

}


function Ofertas() {

    const {
        puede
    } =
        useAuth();


    const puedeModificar =
        puede(
            "ofertas.modificar"
        );


    const [
        ofertas,
        setOfertas
    ] = useState([]);


    const [
        productos,
        setProductos
    ] = useState([]);


    const [
        seleccionados,
        setSeleccionados
    ] = useState([]);


    const [
        busqueda,
        setBusqueda
    ] = useState("");


    const [
        editandoId,
        setEditandoId
    ] = useState(null);


    const [
        nombre,
        setNombre
    ] = useState("");


    const [
        tipo,
        setTipo
    ] = useState(
        "PORCENTAJE"
    );


    const [
        valor,
        setValor
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
        descuentoPorcentaje,
        setDescuentoPorcentaje
    ] = useState("");

    const [
        modoPrecioCombo,
        setModoPrecioCombo
    ] = useState(
        "FIJO"
    );


    const [
        valorReglaCombo,
        setValorReglaCombo
    ] = useState("");


    const [
        alcanceDescuento,
        setAlcanceDescuento
    ] = useState(
        "TOTAL_COMBO"
    );

    const [
        modoCalculoCombo,
        setModoCalculoCombo
    ] = useState(
        "precio"
    );

    const [
        desde,
        setDesde
    ] = useState(
        fechaLocal()
    );


    const [
        hasta,
        setHasta
    ] = useState(
        fechaLocal(24)
    );


    const [
        guardando,
        setGuardando
    ] = useState(false);


    const mostrarError =
        async (error) => {

            await window
                .electronAPI
                .dialogos
                .error(
                    error?.message ||
                    String(error)
                );

        };


    const cargarOfertas =
        async () => {

            const data =
                await window
                    .electronAPI
                    .ofertas
                    .listar();


            setOfertas(
                data
            );

        };


    const buscarProductos =
        async (
            texto = busqueda
        ) => {

            const data =
                await window
                    .electronAPI
                    .ofertas
                    .productos({

                        busqueda:
                            texto,

                        limite:
                            50

                    });


            setProductos(
                data
            );

        };


    useEffect(() => {

        Promise.all([
            cargarOfertas(),
            buscarProductos("")
        ])
            .catch(
                mostrarError
            );

    }, []);


    const limpiar =
        () => {

            setEditandoId(null);

            setNombre("");

            setTipo("PORCENTAJE");

            setValor("");

            setDesde(fechaLocal());

            setHasta(fechaLocal(24));

            setSeleccionados([]);

            setGananciaPorcentaje("");

            setGananciaValor("");

            setDescuentoPorcentaje("");

            setModoCalculoCombo("precio");

            setModoPrecioCombo("FIJO");

            setValorReglaCombo("");

            setAlcanceDescuento("TOTAL_COMBO");

        };


    const seleccionarProducto =
        (producto) => {

            setSeleccionados(
                (actuales) => {

                    const existe =
                        actuales.some(
                            (item) =>
                                item.id ===
                                producto.id
                        );


                    if (existe) {

                        return actuales.filter(
                            (item) =>
                                item.id !==
                                producto.id
                        );

                    }


                    return [
                        ...actuales,

                        {
                            ...producto,

                            cantidad:
                                producto.cantidad ||
                                1
                        }
                    ];


                }
            );

        };

    const cambiarCantidadCombo =
        (
            productoId,
            valor
        ) => {

            const cantidad =
                Math.max(
                    1,
                    Number(valor) ||
                    1
                );


            setSeleccionados(
                (actuales) =>
                    actuales.map(
                        (item) =>
                            item.id ===
                                productoId

                                ? {
                                    ...item,
                                    cantidad
                                }

                                : item
                    )
            );

        };

    const seleccionadosIds =
        useMemo(
            () =>
                new Set(
                    seleccionados
                        .map(
                            (item) =>
                                item.id
                        )
                ),
            [seleccionados]
        );

    const costoCombo =
        useMemo(
            () =>
                redondear(
                    seleccionados.reduce(
                        (
                            total,
                            producto
                        ) =>
                            total +
                            numero(
                                producto.costo
                            ) *
                            (
                                producto.cantidad ||
                                1
                            ),
                        0
                    )
                ),
            [seleccionados]
        );


    const precioNormalCombo =
        useMemo(
            () =>
                redondear(
                    seleccionados.reduce(
                        (
                            total,
                            producto
                        ) =>
                            total +
                            numero(
                                producto.precio_venta
                            ) *
                            (
                                producto.cantidad ||
                                1
                            ),
                        0
                    )
                ),
            [seleccionados]
        );

    const actualizarMetricasDesdePrecio =
        (precio) => {

            const precioNumero =
                numero(
                    precio
                );


            const ganancia =
                redondear(
                    precioNumero -
                    costoCombo
                );


            const porcentajeGanancia =
                costoCombo === 0
                    ? null
                    : redondear(
                        ganancia /
                        costoCombo *
                        100
                    );


            const porcentajeDescuento =
                precioNormalCombo === 0
                    ? null
                    : redondear(
                        (
                            precioNormalCombo -
                            precioNumero
                        ) /
                        precioNormalCombo *
                        100
                    );


            setGananciaValor(
                textoNumero(
                    ganancia
                )
            );


            setGananciaPorcentaje(
                porcentajeGanancia ===
                    null
                    ? ""
                    : textoNumero(
                        porcentajeGanancia
                    )
            );


            setDescuentoPorcentaje(
                porcentajeDescuento ===
                    null
                    ? ""
                    : textoNumero(
                        porcentajeDescuento
                    )
            );

        };


    const cambiarPrecioCombo =
        (valorNuevo) => {

            setModoCalculoCombo(
                "precio"
            );

            setValor(
                valorNuevo
            );

            actualizarMetricasDesdePrecio(
                valorNuevo
            );

        };


    const cambiarGananciaCombo =
        (valorNuevo) => {

            setModoCalculoCombo(
                "ganancia"
            );

            setGananciaValor(
                valorNuevo
            );


            const precio =
                redondear(
                    costoCombo +
                    numero(
                        valorNuevo
                    )
                );


            setValor(
                textoNumero(
                    precio
                )
            );


            const porcentaje =
                costoCombo === 0
                    ? null
                    : redondear(
                        numero(
                            valorNuevo
                        ) /
                        costoCombo *
                        100
                    );


            setGananciaPorcentaje(
                porcentaje === null
                    ? ""
                    : textoNumero(
                        porcentaje
                    )
            );


            const descuento =
                precioNormalCombo === 0
                    ? null
                    : redondear(
                        (
                            precioNormalCombo -
                            precio
                        ) /
                        precioNormalCombo *
                        100
                    );


            setDescuentoPorcentaje(
                descuento === null
                    ? ""
                    : textoNumero(
                        descuento
                    )
            );

        };


    const cambiarGananciaPorcentajeCombo =
        (valorNuevo) => {

            setModoCalculoCombo(
                "porcentaje"
            );

            setGananciaPorcentaje(
                valorNuevo
            );


            const ganancia =
                redondear(
                    costoCombo *
                    numero(
                        valorNuevo
                    ) /
                    100
                );


            const precio =
                redondear(
                    costoCombo +
                    ganancia
                );


            setGananciaValor(
                textoNumero(
                    ganancia
                )
            );


            setValor(
                textoNumero(
                    precio
                )
            );


            const descuento =
                precioNormalCombo === 0
                    ? null
                    : redondear(
                        (
                            precioNormalCombo -
                            precio
                        ) /
                        precioNormalCombo *
                        100
                    );


            setDescuentoPorcentaje(
                descuento === null
                    ? ""
                    : textoNumero(
                        descuento
                    )
            );

        };


    const cambiarDescuentoCombo =
        (valorNuevo) => {

            setModoCalculoCombo(
                "descuento"
            );

            setDescuentoPorcentaje(
                valorNuevo
            );


            const precio =
                redondear(
                    precioNormalCombo *
                    (
                        1 -
                        numero(
                            valorNuevo
                        ) /
                        100
                    )
                );


            setValor(
                textoNumero(
                    precio
                )
            );


            const ganancia =
                redondear(
                    precio -
                    costoCombo
                );


            setGananciaValor(
                textoNumero(
                    ganancia
                )
            );


            setGananciaPorcentaje(
                costoCombo === 0
                    ? ""
                    : textoNumero(
                        ganancia /
                        costoCombo *
                        100
                    )
            );

        };

    const calcularPrecioReglaCombo =
        () => {

            if (
                modoPrecioCombo ===
                "FIJO"
            ) {

                return numero(
                    valor
                );

            }


            if (
                modoPrecioCombo ===
                "PAGA_UNIDADES"
            ) {

                if (
                    seleccionados.length !==
                    1
                ) {

                    return 0;

                }


                const producto =
                    seleccionados[0];


                return redondear(
                    numero(
                        producto.precio_venta
                    ) *
                    numero(
                        valorReglaCombo
                    )
                );

            }


            const porcentaje =
                numero(
                    valorReglaCombo
                );


            if (
                alcanceDescuento ===
                "ULTIMA_UNIDAD"
            ) {

                if (
                    seleccionados.length !==
                    1
                ) {

                    return 0;

                }


                const producto =
                    seleccionados[0];


                const precioUnidad =
                    numero(
                        producto.precio_venta
                    );


                return redondear(

                    precioNormalCombo -

                    (
                        precioUnidad *
                        porcentaje /
                        100
                    )

                );

            }


            return redondear(

                precioNormalCombo *

                (
                    1 -
                    porcentaje /
                    100
                )

            );

        };

    const guardar =
        async (event) => {

            event.preventDefault();


            if (guardando) {
                return;
            }


            setGuardando(true);


            try {

                const datos = {

                    nombre,

                    tipo,

                    valor:
                        Number(valor),

                    fecha_desde:
                        desde,

                    fecha_hasta:
                        hasta

                };


                if (
                    tipo ===
                    "COMBO"
                ) {
                    datos.modo_precio =
                        modoPrecioCombo;


                    datos.valor_regla =
                        modoPrecioCombo ===
                            "FIJO"

                            ? null

                            : Number(
                                valorReglaCombo
                            );


                    datos.alcance_descuento =
                        modoPrecioCombo ===
                            "DESCUENTO_PORCENTAJE"

                            ? alcanceDescuento

                            : "TOTAL_COMBO";
                    datos.productos_combo =
                        seleccionados.map(
                            (item) => ({

                                producto_id:
                                    item.id,

                                cantidad:
                                    item.cantidad ||
                                    1

                            })
                        );


                } else {

                    datos.producto_ids =
                        seleccionados.map(
                            (item) =>
                                item.id
                        );

                }


                if (editandoId) {

                    await window
                        .electronAPI
                        .ofertas
                        .actualizar({

                            id:
                                editandoId,

                            ...datos

                        });


                } else {

                    await window
                        .electronAPI
                        .ofertas
                        .crear(
                            datos
                        );

                }


                limpiar();

                await cargarOfertas();


            } catch (error) {

                await mostrarError(
                    error
                );


            } finally {

                setGuardando(false);

            }

        };


    const editar =
        async (ofertaLista) => {

            try {

                const oferta =
                    await window
                        .electronAPI
                        .ofertas
                        .obtener({

                            id:
                                ofertaLista.id,

                            tipo:
                                ofertaLista.tipo

                        });


                setEditandoId(
                    oferta.id
                );

                setNombre(
                    oferta.nombre
                );

                setTipo(
                    oferta.tipo
                );

                setValor(
                    String(
                        oferta.valor
                    )
                );

                setModoCalculoCombo(
                    "precio"
                );

                setModoPrecioCombo(
                    oferta.modo_precio ||
                    "FIJO"
                );


                setValorReglaCombo(
                    oferta.valor_regla ===
                        null ||
                        oferta.valor_regla ===
                        undefined

                        ? ""

                        : String(
                            oferta.valor_regla
                        )
                );


                setAlcanceDescuento(
                    oferta.alcance_descuento ||
                    "TOTAL_COMBO"
                );

                setDesde(
                    oferta.fecha_desde
                        .slice(
                            0,
                            16
                        )
                );

                setHasta(
                    oferta.fecha_hasta
                        .slice(
                            0,
                            16
                        )
                );

                setSeleccionados(
                    oferta.productos
                );


            } catch (error) {

                await mostrarError(
                    error
                );

            }

        };


    const cambiarActivo =
        async (oferta) => {

            try {

                await window
                    .electronAPI
                    .ofertas
                    .cambiarActivo({

                        id:
                            oferta.id,

                        activo:
                            !Boolean(
                                oferta.activo
                            ),

                        tipo:
                            oferta.tipo,

                    });


                await cargarOfertas();


            } catch (error) {

                await mostrarError(
                    error
                );

            }

        };

    useEffect(() => {
        if (
            tipo !==
            "COMBO" ||
            modoPrecioCombo !==
            "FIJO" ||
            seleccionados.length ===
            0
        ) {

            return;

        }


        if (
            modoCalculoCombo ===
            "descuento"
        ) {

            cambiarDescuentoCombo(
                descuentoPorcentaje
            );


        } else if (
            modoCalculoCombo ===
            "porcentaje"
        ) {

            cambiarGananciaPorcentajeCombo(
                gananciaPorcentaje
            );


        } else if (
            modoCalculoCombo ===
            "ganancia"
        ) {

            cambiarGananciaCombo(
                gananciaValor
            );


        } else {

            actualizarMetricasDesdePrecio(
                valor
            );

        }

    }, [
        costoCombo,
        precioNormalCombo,
        tipo
    ]);

    useEffect(() => {

        if (
            tipo !==
            "COMBO" ||
            modoPrecioCombo ===
            "FIJO" ||
            seleccionados.length ===
            0
        ) {

            return;

        }


        const precio =
            calcularPrecioReglaCombo();


        setValor(
            textoNumero(
                precio
            )
        );


        actualizarMetricasDesdePrecio(
            precio
        );

    }, [
        tipo,
        modoPrecioCombo,
        valorReglaCombo,
        alcanceDescuento,
        precioNormalCombo,
        costoCombo,
        seleccionados
    ]);

    useEffect(() => {

        if (
            alcanceDescuento ===
            "ULTIMA_UNIDAD" &&
            seleccionados.length !==
            1
        ) {

            setAlcanceDescuento(
                "TOTAL_COMBO"
            );

        }

    }, [
        seleccionados.length,
        alcanceDescuento
    ]);

    return (

        <div className="page">

            <PageHeader
                title="Ofertas"
            />


            {puedeModificar && (

                <section>

                    <h2>
                        {
                            editandoId
                                ? "Editar oferta"
                                : "Nueva oferta"
                        }
                    </h2>


                    <form
                        className="offers-form"
                        onSubmit={
                            guardar
                        }
                    >

                        <div className="form-field">

                            <label>
                                Nombre
                            </label>

                            <input
                                value={
                                    nombre
                                }
                                onChange={(event) =>
                                    setNombre(
                                        event.target.value
                                    )
                                }
                            />

                        </div>


                        <div className="form-field">

                            <label>
                                Tipo
                            </label>

                            <select
                                value={
                                    tipo
                                }
                                onChange={(event) =>
                                    setTipo(
                                        event.target.value
                                    )
                                } disabled={
                                    Boolean(
                                        editandoId
                                    )
                                }
                            >

                                <option value="PORCENTAJE">
                                    Porcentaje
                                </option>

                                <option value="PRECIO_FIJO">
                                    Precio de oferta
                                </option>

                                <option value="COMBO">
                                    Combo de productos
                                </option>

                            </select>

                        </div>


                        {tipo !== "COMBO" ? (

                            <div className="form-field">

                                <label>
                                    {
                                        tipo ===
                                            "PORCENTAJE"
                                            ? "Descuento %"
                                            : "Precio oferta"
                                    }
                                </label>

                                <input
                                    type="number"
                                    min="0.01"
                                    step="0.01"
                                    value={
                                        valor
                                    }
                                    onChange={(event) =>
                                        setValor(
                                            event.target.value
                                        )
                                    }
                                />

                            </div>

                        ) : (

                            <div className="offer-price-editor">
                                <div className="offer-rule-grid">

                                    <div className="form-field">

                                        <label>
                                            Modalidad
                                        </label>

                                        <select
                                            value={
                                                modoPrecioCombo
                                            }
                                            onChange={(event) => {

                                                const modo =
                                                    event.target.value;


                                                setModoPrecioCombo(
                                                    modo
                                                );

                                                setValorReglaCombo("");


                                                if (
                                                    modo !==
                                                    "DESCUENTO_PORCENTAJE"
                                                ) {

                                                    setAlcanceDescuento(
                                                        "TOTAL_COMBO"
                                                    );

                                                }


                                                if (
                                                    modo ===
                                                    "FIJO"
                                                ) {

                                                    setModoCalculoCombo(
                                                        "precio"
                                                    );

                                                }

                                            }}
                                        >

                                            <option value="FIJO">
                                                Precio final fijo
                                            </option>

                                            <option value="DESCUENTO_PORCENTAJE">
                                                Descuento porcentual
                                            </option>

                                            <option value="PAGA_UNIDADES">
                                                Llevás X, pagás Y
                                            </option>

                                        </select>

                                    </div>


                                    {modoPrecioCombo ===
                                        "DESCUENTO_PORCENTAJE" && (

                                            <div className="form-field">

                                                <label>
                                                    Aplicar descuento
                                                </label>

                                                <select
                                                    value={
                                                        alcanceDescuento
                                                    }
                                                    onChange={(event) =>
                                                        setAlcanceDescuento(
                                                            event.target.value
                                                        )
                                                    }
                                                >

                                                    <option value="TOTAL_COMBO">
                                                        Sobre toda la promoción
                                                    </option>

                                                    <option
                                                        value="ULTIMA_UNIDAD"
                                                        disabled={
                                                            seleccionados.length !==
                                                            1
                                                        }
                                                    >
                                                        Solo sobre la última unidad
                                                    </option>

                                                </select>

                                            </div>

                                        )}


                                    {modoPrecioCombo ===
                                        "PAGA_UNIDADES" && (

                                            <div className="form-field">

                                                <label>
                                                    Unidades que paga
                                                </label>

                                                <input
                                                    type="number"
                                                    min="1"
                                                    step="1"
                                                    max={
                                                        seleccionados.length ===
                                                            1

                                                            ? Math.max(
                                                                1,
                                                                (
                                                                    seleccionados[0]
                                                                        .cantidad ||
                                                                    1
                                                                ) -
                                                                1
                                                            )

                                                            : undefined
                                                    }
                                                    value={
                                                        valorReglaCombo
                                                    }
                                                    onChange={(event) =>
                                                        setValorReglaCombo(
                                                            event.target.value
                                                        )
                                                    }
                                                />

                                            </div>

                                        )}

                                </div>
                                <h3>
                                    Precio de la oferta
                                </h3>


                                <div className="price-grid">

                                    <div className="form-field">

                                        <label>
                                            Costo total $
                                        </label>

                                        <input
                                            type="number"
                                            value={
                                                costoCombo
                                            }
                                            readOnly
                                        />

                                    </div>


                                    <div className="form-field">

                                        <label>
                                            Precio normal $
                                        </label>

                                        <input
                                            type="number"
                                            value={
                                                precioNormalCombo
                                            }
                                            readOnly
                                        />

                                    </div>


                                    <div className="form-field">

                                        <label>
                                            Descuento %
                                        </label>

                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            max="99.99"
                                            value={
                                                modoPrecioCombo ===
                                                    "DESCUENTO_PORCENTAJE"

                                                    ? valorReglaCombo

                                                    : descuentoPorcentaje
                                            }
                                            readOnly={
                                                modoPrecioCombo ===
                                                "PAGA_UNIDADES"
                                            }
                                            onChange={(event) => {

                                                if (
                                                    modoPrecioCombo ===
                                                    "DESCUENTO_PORCENTAJE"
                                                ) {

                                                    setValorReglaCombo(
                                                        event.target.value
                                                    );

                                                } else {

                                                    cambiarDescuentoCombo(
                                                        event.target.value
                                                    );

                                                }
                                            }}
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
                                            readOnly={
                                                modoPrecioCombo !==
                                                "FIJO"
                                            }
                                            onChange={(event) =>
                                                cambiarGananciaPorcentajeCombo(
                                                    event.target.value
                                                )
                                            }
                                            disabled={
                                                costoCombo === 0
                                            }
                                        />

                                    </div>


                                    <div className="form-field">

                                        <label>
                                            Ganancia neta $
                                        </label>

                                        <input
                                            type="number"
                                            step="0.01"
                                            value={
                                                gananciaValor
                                            }
                                            readOnly={
                                                modoPrecioCombo !==
                                                "FIJO"
                                            }
                                            onChange={(event) =>
                                                cambiarGananciaCombo(
                                                    event.target.value
                                                )
                                            }
                                        />

                                    </div>


                                    <div className="form-field price-sale-field">

                                        <label>
                                            Precio oferta $
                                        </label>

                                        <input
                                            type="number"
                                            min="0.01"
                                            step="0.01"
                                            value={
                                                valor
                                            }
                                            readOnly={
                                                modoPrecioCombo !==
                                                "FIJO"
                                            }
                                            onChange={(event) =>
                                                cambiarPrecioCombo(
                                                    event.target.value
                                                )
                                            }
                                        />

                                    </div>

                                </div>


                                <div
                                    className={
                                        numero(
                                            gananciaValor
                                        ) < 0

                                            ? "price-summary price-summary--loss offer-price-summary"

                                            : "price-summary offer-price-summary"
                                    }
                                >

                                    <span>
                                        Costo
                                        <strong>
                                            {
                                                moneda.format(
                                                    costoCombo
                                                )
                                            }
                                        </strong>
                                    </span>


                                    <span>
                                        Precio normal
                                        <strong>
                                            {
                                                moneda.format(
                                                    precioNormalCombo
                                                )
                                            }
                                        </strong>
                                    </span>


                                    <span>
                                        Ganancia neta
                                        <strong>
                                            {
                                                moneda.format(
                                                    numero(
                                                        gananciaValor
                                                    )
                                                )
                                            }
                                        </strong>
                                    </span>


                                    <span>
                                        Ganancia
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
                                        Descuento
                                        <strong>
                                            {
                                                descuentoPorcentaje ===
                                                    ""
                                                    ? "—"
                                                    : `${descuentoPorcentaje}%`
                                            }
                                        </strong>
                                    </span>


                                    <span>
                                        Oferta
                                        <strong>
                                            {
                                                moneda.format(
                                                    numero(
                                                        valor
                                                    )
                                                )
                                            }
                                        </strong>
                                    </span>

                                </div>

                            </div>

                        )}


                        <div className="form-field">

                            <label>
                                Desde
                            </label>

                            <input
                                type="datetime-local"
                                value={
                                    desde
                                }
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
                                type="datetime-local"
                                value={
                                    hasta
                                }
                                onChange={(event) =>
                                    setHasta(
                                        event.target.value
                                    )
                                }
                            />

                        </div>


                        <div className="offer-products">

                            <h3>
                                Productos
                            </h3>


                            <div className="offer-product-search">

                                <input
                                    value={
                                        busqueda
                                    }
                                    onChange={(event) =>
                                        setBusqueda(
                                            event.target.value
                                        )
                                    }
                                    placeholder=
                                    "Buscar producto"
                                />

                                <button
                                    type="button"
                                    onClick={() =>
                                        buscarProductos(
                                            busqueda
                                        )
                                    }
                                >
                                    Buscar
                                </button>

                            </div>


                            <div className="offer-product-results">

                                {productos.map(
                                    (producto) => (

                                        <label
                                            key={
                                                producto.id
                                            }
                                        >

                                            <input
                                                type="checkbox"
                                                checked={
                                                    seleccionadosIds
                                                        .has(
                                                            producto.id
                                                        )
                                                }
                                                onChange={() =>
                                                    seleccionarProducto(
                                                        producto
                                                    )
                                                }
                                            />

                                            <span>
                                                {
                                                    producto.nombre
                                                }

                                                {
                                                    producto.codigo
                                                        ? ` · ${producto.codigo}`
                                                        : ""
                                                }
                                            </span>

                                            <span>
                                                {
                                                    producto.precio_venta != null
                                                        ? moneda.format(
                                                            producto.precio_venta
                                                        )
                                                        : "Sin precio"
                                                }
                                            </span>

                                        </label>

                                    )
                                )}

                            </div>


                            {seleccionados.length > 0 && (

                                <div className="offer-selected">

                                    <strong>
                                        Seleccionados:
                                    </strong>


                                    {seleccionados.map(
                                        (producto) => (

                                            <div
                                                className="offer-selected-item"
                                                key={producto.id}
                                            >

                                                <span>
                                                    {producto.nombre}
                                                </span>


                                                {tipo === "COMBO" && (

                                                    <input
                                                        type="number"
                                                        min="1"
                                                        step="1"
                                                        value={
                                                            producto.cantidad || 1
                                                        }
                                                        onChange={(event) =>
                                                            cambiarCantidadCombo(
                                                                producto.id,
                                                                event.target.value
                                                            )
                                                        }
                                                    />

                                                )}


                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        seleccionarProducto(
                                                            producto
                                                        )
                                                    }
                                                >
                                                    ×
                                                </button>

                                            </div>

                                        )
                                    )}

                                </div>

                            )}

                        </div>


                        <div className="form-actions">

                            <button
                                type="submit"
                                disabled={
                                    guardando
                                }
                            >

                                {
                                    guardando
                                        ? "Guardando..."
                                        : editandoId
                                            ? "Guardar cambios"
                                            : "Crear oferta"
                                }

                            </button>


                            {editandoId && (

                                <button
                                    type="button"
                                    onClick={
                                        limpiar
                                    }
                                >
                                    Cancelar
                                </button>

                            )}

                        </div>

                    </form>

                </section>

            )}


            <section>

                <h2>
                    Ofertas cargadas
                </h2>


                <div className="offers-table-wrapper">

                    <table className="offers-table">

                        <thead>

                            <tr>
                                <th>Oferta</th>
                                <th>Tipo</th>
                                <th>Valor</th>
                                <th>Desde</th>
                                <th>Hasta</th>
                                <th>Productos</th>
                                <th>Estado</th>

                                {puedeModificar && (
                                    <th>Acciones</th>
                                )}

                            </tr>

                        </thead>


                        <tbody>

                            {ofertas.map(
                                (oferta) => (

                                    <tr
                                        key={
                                            `${oferta.tipo}-${oferta.id}`
                                        }
                                    >

                                        <td>
                                            {
                                                oferta.nombre
                                            }
                                        </td>

                                        <td>
                                            {
                                                oferta.tipo ===
                                                    "PORCENTAJE"

                                                    ? "Porcentaje"

                                                    : oferta.tipo ===
                                                        "COMBO"

                                                        ? "Combo"

                                                        : "Precio fijo"
                                            }
                                        </td>

                                        <td>

                                            {
                                                oferta.tipo ===
                                                    "PORCENTAJE"

                                                    ? `${oferta.valor}%`

                                                    : moneda.format(
                                                        oferta.valor
                                                    )
                                            }

                                        </td>

                                        <td>
                                            {
                                                new Date(
                                                    oferta.fecha_desde
                                                )
                                                    .toLocaleString(
                                                        "es-AR"
                                                    )
                                            }
                                        </td>

                                        <td>
                                            {
                                                new Date(
                                                    oferta.fecha_hasta
                                                )
                                                    .toLocaleString(
                                                        "es-AR"
                                                    )
                                            }
                                        </td>

                                        <td>
                                            {
                                                oferta.total_productos
                                            }
                                        </td>

                                        <td>
                                            {
                                                oferta.estado_vigencia
                                            }
                                        </td>


                                        {puedeModificar && (

                                            <td>

                                                <div className="table-actions">

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            editar(
                                                                oferta
                                                            )
                                                        }
                                                    >
                                                        Editar
                                                    </button>


                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            cambiarActivo(
                                                                oferta
                                                            )
                                                        }
                                                    >

                                                        {
                                                            oferta.activo
                                                                ? "Desactivar"
                                                                : "Activar"
                                                        }

                                                    </button>

                                                </div>

                                            </td>

                                        )}

                                    </tr>

                                )
                            )}

                        </tbody>

                    </table>

                </div>

            </section>

        </div>

    );

}


export default Ofertas;