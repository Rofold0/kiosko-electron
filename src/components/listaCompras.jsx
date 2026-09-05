import {
    useEffect,
    useState
} from "react";

import PageHeader
    from "../components/pageHeader.jsx";

import CrudTable
    from "../components/crudTable.jsx";


const columnasHistorico = [

    {
        key: "nombre",
        label: "Ítem"
    },

    {
        key: "cantidad",
        label: "Cantidad"
    },

    {
        key: "comprado",
        label: "Estado",

        render: (item) =>
            item.comprado
                ? "Comprado"
                : "Pendiente"
    }

];


function ListaCompras() {

    const [
        lista,
        setLista
    ] = useState(null);

    const [
        notas,
        setNotas
    ] = useState("");

    const [
        busqueda,
        setBusqueda
    ] = useState("");

    const [
        resultados,
        setResultados
    ] = useState([]);

    const [
        cantidadProducto,
        setCantidadProducto
    ] = useState("1");

    const [
        nombreLibre,
        setNombreLibre
    ] = useState("");

    const [
        cantidadLibre,
        setCantidadLibre
    ] = useState("1");

    const [
        historial,
        setHistorial
    ] = useState([]);

    const [
        listaHistorica,
        setListaHistorica
    ] = useState(null);


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


    const aplicarLista =
        (data) => {

            setLista(data);

            setNotas(
                data?.notas ||
                ""
            );

        };


    const cargarTodo =
        async () => {

            try {

                const [
                    actual,
                    historialData
                ] =
                    await Promise.all([

                        window
                            .electronAPI
                            .listaCompras
                            .actual(),

                        window
                            .electronAPI
                            .listaCompras
                            .historial()

                    ]);


                aplicarLista(
                    actual
                );

                setHistorial(
                    historialData
                );


            } catch (error) {

                await mostrarError(
                    error
                );

            }

        };


    useEffect(() => {

        cargarTodo();

    }, []);


    const buscarProductos =
        async (e) => {

            e.preventDefault();


            if (!busqueda.trim()) {

                setResultados([]);

                return;

            }


            try {

                const resultado =
                    await window
                        .electronAPI
                        .productos
                        .listar({

                            busqueda:
                                busqueda.trim(),

                            categoria_id:
                                null,

                            subcategoria_id:
                                null,

                            pagina: 1,

                            limite: 20

                        });


                setResultados(
                    resultado.items
                );


            } catch (error) {

                await mostrarError(
                    error
                );

            }

        };


    const agregarProducto =
        async (producto) => {

            try {

                const actualizada =
                    await window
                        .electronAPI
                        .listaCompras
                        .agregarProducto({

                            producto_id:
                                producto.id,

                            cantidad:
                                Number(
                                    cantidadProducto
                                )

                        });


                aplicarLista(
                    actualizada
                );

                setCantidadProducto(
                    "1"
                );


            } catch (error) {

                await mostrarError(
                    error
                );

            }

        };


    const agregarLibre =
        async (e) => {

            e.preventDefault();


            try {

                const actualizada =
                    await window
                        .electronAPI
                        .listaCompras
                        .agregarLibre({

                            nombre:
                                nombreLibre,

                            cantidad:
                                Number(
                                    cantidadLibre
                                )

                        });


                aplicarLista(
                    actualizada
                );

                setNombreLibre("");

                setCantidadLibre("1");


            } catch (error) {

                await mostrarError(
                    error
                );

            }

        };


    const agregarStockBajo =
        async () => {

            try {

                const resultado =
                    await window
                        .electronAPI
                        .listaCompras
                        .agregarStockBajo();


                aplicarLista(
                    resultado.lista
                );


            } catch (error) {

                await mostrarError(
                    error
                );

            }

        };


    const cambiarCantidadLocal =
        (
            itemId,
            valor
        ) => {

            setLista((actual) => ({

                ...actual,

                items:
                    actual.items.map(
                        (item) =>
                            item.id === itemId
                                ? {
                                    ...item,
                                    cantidad:
                                        valor
                                }
                                : item
                    )

            }));

        };


    const guardarCantidad =
        async (item) => {

            const cantidad =
                Number(
                    item.cantidad
                );


            if (
                !Number.isInteger(
                    cantidad
                ) ||
                cantidad <= 0
            ) {

                await cargarTodo();

                return;
            }


            try {

                const actualizada =
                    await window
                        .electronAPI
                        .listaCompras
                        .actualizarCantidad({

                            item_id:
                                item.id,

                            cantidad

                        });


                aplicarLista(
                    actualizada
                );


            } catch (error) {

                await mostrarError(
                    error
                );

                await cargarTodo();

            }

        };


    const cambiarComprado =
        async (
            item,
            comprado
        ) => {

            try {

                const actualizada =
                    await window
                        .electronAPI
                        .listaCompras
                        .marcarComprado({

                            item_id:
                                item.id,

                            comprado

                        });


                aplicarLista(
                    actualizada
                );


            } catch (error) {

                await mostrarError(
                    error
                );

            }

        };


    const eliminarItem =
        async (id) => {

            const confirmar =
                await window
                    .electronAPI
                    .dialogos
                    .confirmar(
                        "¿Eliminar este ítem de la lista?"
                    );


            if (!confirmar) {
                return;
            }


            try {

                const actualizada =
                    await window
                        .electronAPI
                        .listaCompras
                        .eliminarItem(
                            id
                        );


                aplicarLista(
                    actualizada
                );


            } catch (error) {

                await mostrarError(
                    error
                );

            }

        };


    const guardarNotas =
        async () => {

            try {

                const actualizada =
                    await window
                        .electronAPI
                        .listaCompras
                        .actualizarNotas(
                            notas
                        );


                aplicarLista(
                    actualizada
                );


            } catch (error) {

                await mostrarError(
                    error
                );

            }

        };


    const finalizarLista =
        async () => {

            const confirmar =
                await window
                    .electronAPI
                    .dialogos
                    .confirmar(
                        "¿Finalizar esta lista? Los ítems pendientes pasarán automáticamente a la próxima lista."
                    );


            if (!confirmar) {
                return;
            }


            try {

                await window
                    .electronAPI
                    .listaCompras
                    .completar();


                setListaHistorica(
                    null
                );

                await cargarTodo();


            } catch (error) {

                await mostrarError(
                    error
                );

            }

        };


    const abrirHistorial =
        async (id) => {

            try {

                const data =
                    await window
                        .electronAPI
                        .listaCompras
                        .obtener(id);


                setListaHistorica(
                    data
                );


            } catch (error) {

                await mostrarError(
                    error
                );

            }

        };


    if (!lista) {

        return (

            <div className="page">

                <PageHeader
                    title="Lista de compras"
                />

                <p>
                    Cargando...
                </p>

            </div>

        );

    }


    const comprados =
        lista.items.filter(
            (item) =>
                Boolean(
                    item.comprado
                )
        ).length;


    return (

        <div className="page">

            <PageHeader
                title="Lista de compras"
            />


            <section className="shopping-summary">

                <div>

                    <strong>
                        {lista.items.length}
                    </strong>

                    {" ítems · "}

                    <strong>
                        {comprados}
                    </strong>

                    {" comprados"}

                </div>


                <button
                    type="button"
                    onClick={
                        agregarStockBajo
                    }
                >
                    Agregar stock bajo
                </button>

            </section>


            <section>

                <h2>
                    Agregar producto
                </h2>


                <form
                    className="shopping-search"
                    onSubmit={
                        buscarProductos
                    }
                >

                    <div className="form-field">

                        <label>
                            Nombre o código
                        </label>

                        <input
                            value={busqueda}
                            onChange={(e) =>
                                setBusqueda(
                                    e.target.value
                                )
                            }
                        />

                    </div>


                    <div className="form-field">

                        <label>
                            Cantidad
                        </label>

                        <input
                            type="number"
                            min="1"
                            step="1"
                            value={
                                cantidadProducto
                            }
                            onChange={(e) =>
                                setCantidadProducto(
                                    e.target.value
                                )
                            }
                        />

                    </div>


                    <button type="submit">
                        Buscar
                    </button>

                </form>


                <div className="shopping-results">

                    {resultados.map(
                        (producto) => (

                            <button
                                key={
                                    producto.id
                                }
                                type="button"
                                onClick={() =>
                                    agregarProducto(
                                        producto
                                    )
                                }
                            >

                                {
                                    producto.nombre
                                }

                                {" — Stock: "}

                                {
                                    producto.stock_actual
                                }

                            </button>

                        )
                    )}

                </div>

            </section>


            <section>

                <h2>
                    Agregar ítem libre
                </h2>


                <form
                    className="shopping-search"
                    onSubmit={
                        agregarLibre
                    }
                >

                    <div className="form-field">

                        <label>
                            Descripción
                        </label>

                        <input
                            value={nombreLibre}
                            onChange={(e) =>
                                setNombreLibre(
                                    e.target.value
                                )
                            }
                            placeholder=
                                "Ej: bolsas, servilletas..."
                        />

                    </div>


                    <div className="form-field">

                        <label>
                            Cantidad
                        </label>

                        <input
                            type="number"
                            min="1"
                            value={
                                cantidadLibre
                            }
                            onChange={(e) =>
                                setCantidadLibre(
                                    e.target.value
                                )
                            }
                        />

                    </div>


                    <button type="submit">
                        Agregar
                    </button>

                </form>

            </section>


            <section>

                <h2>
                    Lista actual
                </h2>


                <div className="shopping-table-wrapper">

                    <table className="shopping-table">

                        <thead>

                            <tr>

                                <th>
                                    ✓
                                </th>

                                <th>
                                    Ítem
                                </th>

                                <th>
                                    Cantidad
                                </th>

                                <th>
                                    Stock
                                </th>

                                <th>
                                    Acción
                                </th>

                            </tr>

                        </thead>


                        <tbody>

                            {lista.items.length === 0 ? (

                                <tr>

                                    <td
                                        colSpan="5"
                                        className="crud-table-empty"
                                    >
                                        La lista está vacía.
                                    </td>

                                </tr>

                            ) : (

                                lista.items.map(
                                    (item) => (

                                        <tr
                                            key={
                                                item.id
                                            }
                                            className={
                                                item.comprado
                                                    ? "shopping-item--done"
                                                    : ""
                                            }
                                        >

                                            <td>

                                                <input
                                                    type="checkbox"
                                                    checked={
                                                        Boolean(
                                                            item.comprado
                                                        )
                                                    }
                                                    onChange={(e) =>
                                                        cambiarComprado(
                                                            item,
                                                            e.target.checked
                                                        )
                                                    }
                                                />

                                            </td>


                                            <td>

                                                <strong>
                                                    {
                                                        item.nombre
                                                    }
                                                </strong>

                                                {item.codigo && (

                                                    <small>
                                                        {
                                                            item.codigo
                                                        }
                                                    </small>

                                                )}

                                            </td>


                                            <td>

                                                <input
                                                    className="shopping-quantity"
                                                    type="number"
                                                    min="1"
                                                    step="1"
                                                    value={
                                                        item.cantidad
                                                    }
                                                    onChange={(e) =>
                                                        cambiarCantidadLocal(
                                                            item.id,
                                                            e.target.value
                                                        )
                                                    }
                                                    onBlur={() =>
                                                        guardarCantidad(
                                                            item
                                                        )
                                                    }
                                                />

                                            </td>


                                            <td>

                                                {
                                                    item.producto_id
                                                        ? item.stock_actual
                                                        : "—"
                                                }

                                            </td>


                                            <td>

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        eliminarItem(
                                                            item.id
                                                        )
                                                    }
                                                >
                                                    Eliminar
                                                </button>

                                            </td>

                                        </tr>

                                    )
                                )

                            )}

                        </tbody>

                    </table>

                </div>

            </section>


            <section className="shopping-notes">

                <div className="form-field">

                    <label>
                        Notas
                    </label>

                    <textarea
                        rows="3"
                        value={notas}
                        onChange={(e) =>
                            setNotas(
                                e.target.value
                            )
                        }
                    />

                </div>


                <button
                    type="button"
                    onClick={
                        guardarNotas
                    }
                >
                    Guardar notas
                </button>

            </section>


            <div className="shopping-finish">

                <button
                    type="button"
                    disabled={
                        lista.items.length === 0
                    }
                    onClick={
                        finalizarLista
                    }
                >
                    Finalizar lista
                </button>

            </div>


            <section>

                <h2>
                    Historial
                </h2>


                <div className="shopping-history">

                    {historial.length === 0 ? (

                        <p>
                            Todavía no hay listas finalizadas.
                        </p>

                    ) : (

                        historial.map(
                            (item) => (

                                <button
                                    key={
                                        item.id
                                    }
                                    type="button"
                                    onClick={() =>
                                        abrirHistorial(
                                            item.id
                                        )
                                    }
                                >

                                    {
                                        new Date(
                                            item.fecha_completada
                                        )
                                            .toLocaleString(
                                                "es-AR"
                                            )
                                    }

                                    {" · "}

                                    {
                                        item.comprados
                                    }
                                    /
                                    {
                                        item.total_items
                                    }

                                </button>

                            )
                        )

                    )}

                </div>


                {listaHistorica && (

                    <div className="shopping-history-detail">

                        <h3>
                            Lista del{" "}
                            {
                                new Date(
                                    listaHistorica
                                        .fecha_creacion
                                )
                                    .toLocaleString(
                                        "es-AR"
                                    )
                            }
                        </h3>


                        <CrudTable
                            columns={
                                columnasHistorico
                            }
                            items={
                                listaHistorica.items
                            }
                            emptyMessage=
                                "La lista no tiene ítems."
                        />

                    </div>

                )}

            </section>

        </div>

    );

}


export default ListaCompras;