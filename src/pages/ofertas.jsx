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

            setEditandoId(
                null
            );

            setNombre("");

            setTipo(
                "PORCENTAJE"
            );

            setValor("");

            setDesde(
                fechaLocal()
            );

            setHasta(
                fechaLocal(24)
            );

            setSeleccionados([]);

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


                        <div className="form-field">

                            <label>

                                {
                                    tipo ===
                                        "PORCENTAJE"

                                        ? "Descuento %"

                                        : tipo ===
                                            "COMBO"

                                            ? "Precio del combo"

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