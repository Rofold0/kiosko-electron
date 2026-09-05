import {
    useEffect,
    useState
} from "react";

import PageHeader
    from "../components/pageHeader.jsx";

import CrudTable
    from "../components/crudTable.jsx";


const columnasMovimientos = [

    {
        key: "fecha",
        label: "Fecha",

        render: (movimiento) =>
            new Date(
                movimiento.fecha
            ).toLocaleString(
                "es-AR"
            )
    },

    {
        key: "tipo",
        label: "Tipo"
    },

    {
        key: "cantidad",
        label: "Cambio",

        render: (movimiento) =>
            movimiento.cantidad > 0
                ? `+${movimiento.cantidad}`
                : movimiento.cantidad
    },

    {
        key: "stock_anterior",
        label: "Anterior"
    },

    {
        key: "stock_nuevo",
        label: "Nuevo"
    },

    {
        key: "motivo",
        label: "Motivo",

        render: (movimiento) =>
            movimiento.motivo ||
            "—"
    }

];


function Stock() {

    const [
        alertas,
        setAlertas
    ] = useState([]);

    const [
        busqueda,
        setBusqueda
    ] = useState("");

    const [
        resultados,
        setResultados
    ] = useState([]);

    const [
        producto,
        setProducto
    ] = useState(null);

    const [
        tipo,
        setTipo
    ] = useState("ENTRADA");

    const [
        cantidad,
        setCantidad
    ] = useState("1");

    const [
        nuevoStock,
        setNuevoStock
    ] = useState("0");

    const [
        motivo,
        setMotivo
    ] = useState("");

    const [
        movimientos,
        setMovimientos
    ] = useState([]);

    const cargarAlertas =
        async () => {

            try {

                const data =
                    await window
                        .electronAPI
                        .stock
                        .bajoMinimo();


                setAlertas(
                    data
                );


            } catch (error) {

                console.error(
                    "Error cargando alertas:",
                    error
                );

            }

        };

    const mostrarError =
        async (error) => {

            console.error(error);

            await window.electronAPI
                .dialogos
                .error(
                    error?.message ||
                    String(error)
                );

        };


    const buscarProductos =
        async (e) => {

            e.preventDefault();


            try {

                const resultado =
                    await window.electronAPI
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


    const cargarMovimientos =
        async (productoId) => {

            const resultado =
                await window.electronAPI
                    .stock
                    .movimientos({

                        producto_id:
                            productoId,

                        pagina: 1,

                        limite: 50

                    });


            setMovimientos(
                resultado.items
            );

        };


    const seleccionarProducto =
        async (item) => {

            setProducto(item);

            setNuevoStock(
                String(
                    item.stock_actual
                )
            );

            setCantidad("1");

            setMotivo("");

            await cargarMovimientos(
                item.id
            );

        };


    const guardarMovimiento =
        async (e) => {

            e.preventDefault();


            if (!producto) {

                await window.electronAPI
                    .dialogos
                    .error(
                        "Seleccione un producto."
                    );

                return;
            }


            try {

                let resultado;


                if (tipo === "ENTRADA") {

                    resultado =
                        await window.electronAPI
                            .stock
                            .entrada({

                                producto_id:
                                    producto.id,

                                cantidad:
                                    Number(
                                        cantidad
                                    ),

                                motivo

                            });


                } else if (
                    tipo === "SALIDA"
                ) {

                    resultado =
                        await window.electronAPI
                            .stock
                            .salida({

                                producto_id:
                                    producto.id,

                                cantidad:
                                    Number(
                                        cantidad
                                    ),

                                motivo

                            });


                } else {

                    resultado =
                        await window.electronAPI
                            .stock
                            .ajustar({

                                producto_id:
                                    producto.id,

                                nuevo_stock:
                                    Number(
                                        nuevoStock
                                    ),

                                motivo

                            });

                }


                setProducto(
                    resultado.producto
                );


                setNuevoStock(
                    String(
                        resultado
                            .producto
                            .stock_actual
                    )
                );


                setCantidad("1");

                setMotivo("");


                await cargarMovimientos(
                    producto.id
                );

                await cargarAlertas();


            } catch (error) {

                await mostrarError(
                    error
                );

            }

        };

    useEffect(() => {

        cargarAlertas();

    }, []);

    return (

        <div className="page">

            <PageHeader
                title="Stock"
            />

            {alertas.length > 0 && (

                <section className="stock-alert-panel">

                    <div className="stock-alert-header">

                        <div>

                            <h2>
                                Reposición necesaria
                            </h2>

                            <p>
                                {alertas.length} producto
                                {alertas.length !== 1
                                    ? "s"
                                    : ""}
                                {" con stock bajo."}
                            </p>

                        </div>

                    </div>


                    <div className="stock-alert-list">

                        {alertas.map(
                            (item) => (

                                <button
                                    key={item.id}
                                    type="button"
                                    className={
                                        item.stock_actual === 0
                                            ? "stock-alert-item stock-alert-item--critical"
                                            : "stock-alert-item"
                                    }
                                    onClick={() =>
                                        seleccionarProducto(
                                            item
                                        )
                                    }
                                >

                                    <span className="stock-alert-product">

                                        {
                                            item.nombre
                                        }

                                    </span>


                                    <span>

                                        Stock:{" "}

                                        <strong>
                                            {
                                                item.stock_actual
                                            }
                                        </strong>

                                        {" / mín. "}

                                        {
                                            item.stock_minimo
                                        }

                                    </span>

                                </button>

                            )
                        )}

                    </div>

                </section>

            )}


            <h2>
                Buscar producto
            </h2>


            <form
                className="stock-search"
                onSubmit={
                    buscarProductos
                }
            >

                <div className="form-field">

                    <label htmlFor="stock-busqueda">
                        Nombre o código
                    </label>

                    <input
                        id="stock-busqueda"
                        value={busqueda}
                        onChange={(e) =>
                            setBusqueda(
                                e.target.value
                            )
                        }
                    />

                </div>


                <button type="submit">
                    Buscar
                </button>

            </form>


            <div className="stock-results">

                {resultados.map(
                    (item) => (

                        <button
                            key={item.id}
                            type="button"
                            onClick={() =>
                                seleccionarProducto(
                                    item
                                )
                            }
                        >
                            {item.nombre}
                            {" — Stock: "}
                            {item.stock_actual}
                        </button>

                    )
                )}

            </div>


            {producto && (

                <>

                    <h2>
                        {producto.nombre}
                    </h2>


                    <p>
                        Stock actual:{" "}
                        <strong>
                            {
                                producto
                                    .stock_actual
                            }
                        </strong>
                        {" "}
                        {producto.unidad}
                    </p>


                    <p>
                        Stock mínimo:{" "}
                        {
                            producto
                                .stock_minimo
                        }
                    </p>


                    <form
                        className="stock-form"
                        onSubmit={
                            guardarMovimiento
                        }
                    >

                        <div className="form-field">

                            <label>
                                Movimiento
                            </label>

                            <select
                                value={tipo}
                                onChange={(e) =>
                                    setTipo(
                                        e.target.value
                                    )
                                }
                            >

                                <option value="ENTRADA">
                                    Entrada
                                </option>

                                <option value="SALIDA">
                                    Salida
                                </option>

                                <option value="AJUSTE">
                                    Ajuste
                                </option>

                            </select>

                        </div>


                        {tipo === "AJUSTE"
                            ? (

                                <div className="form-field">

                                    <label>
                                        Nuevo stock
                                    </label>

                                    <input
                                        type="number"
                                        min="0"
                                        step="1"
                                        value={
                                            nuevoStock
                                        }
                                        onChange={(e) =>
                                            setNuevoStock(
                                                e.target.value
                                            )
                                        }
                                    />

                                </div>

                            )
                            : (

                                <div className="form-field">

                                    <label>
                                        Cantidad
                                    </label>

                                    <input
                                        type="number"
                                        min="1"
                                        step="1"
                                        value={
                                            cantidad
                                        }
                                        onChange={(e) =>
                                            setCantidad(
                                                e.target.value
                                            )
                                        }
                                    />

                                </div>

                            )
                        }


                        <div className="form-field">

                            <label>
                                Motivo
                            </label>

                            <input
                                value={motivo}
                                onChange={(e) =>
                                    setMotivo(
                                        e.target.value
                                    )
                                }
                                placeholder="Opcional"
                            />

                        </div>


                        <button type="submit">
                            Registrar
                        </button>

                    </form>


                    <h2>
                        Historial
                    </h2>


                    <CrudTable
                        columns={
                            columnasMovimientos
                        }
                        items={
                            movimientos
                        }
                        emptyMessage=
                        "No hay movimientos."
                    />

                </>

            )}

        </div>

    );

}


export default Stock;