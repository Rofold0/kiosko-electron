import {
    useEffect,
    useState
} from "react";

import { useNavigate }
    from "react-router-dom";

import DashboardCard
    from "../components/dashboardCard.jsx";

import { ROUTES }
    from "../../shared/routes.js";


function Dashboard() {

    const navigate =
        useNavigate();


    const [
        alertasStock,
        setAlertasStock
    ] = useState([]);


    const [
        cargandoAlertas,
        setCargandoAlertas
    ] = useState(true);


    const [
        errorAlertas,
        setErrorAlertas
    ] = useState(false);


    useEffect(() => {

        const cargarAlertas =
            async () => {

                try {

                    const data =
                        await window
                            .electronAPI
                            .stock
                            .bajoMinimo();


                    setAlertasStock(
                        data
                    );


                } catch (error) {

                    console.error(
                        "Error cargando alertas de stock:",
                        error
                    );

                    setErrorAlertas(true);


                } finally {

                    setCargandoAlertas(false);

                }

            };


        cargarAlertas();

    }, []);


    const sinStock =
        alertasStock.filter(
            (producto) =>
                producto.stock_actual === 0
        );


    const stockBajo =
        alertasStock.filter(
            (producto) =>
                producto.stock_actual > 0
        );

    const agregarFaltantes =
        async () => {

            try {

                await window
                    .electronAPI
                    .listaCompras
                    .agregarStockBajo();


                navigate(
                    ROUTES.listaCompras
                );


            } catch (error) {

                await window
                    .electronAPI
                    .dialogos
                    .error(
                        error.message
                    );

            }

        };

    return (

        <div className="page">

            <h1>Kiosko</h1>


            {/* ALERTAS */}

            <section className="stock-alert-panel">

                <div className="stock-alert-header">

                    <div>

                        <h2>
                            Alertas de stock
                        </h2>

                        <p>
                            Productos que necesitan reposición.
                        </p>

                    </div>


                    <button
                        type="button"
                        onClick={() =>
                            navigate(
                                ROUTES.stock
                            )
                        }
                    >
                        Ir a Stock
                    </button>
                    <button
                        type="button"
                        onClick={
                            agregarFaltantes
                        }
                    >
                        Agregar faltantes a compras
                    </button>

                </div>


                {cargandoAlertas ? (

                    <p>
                        Cargando stock...
                    </p>

                ) : errorAlertas ? (

                    <p>
                        No se pudieron cargar
                        las alertas.
                    </p>

                ) : alertasStock.length === 0 ? (

                    <p className="stock-alert-ok">
                        No hay productos con
                        stock bajo.
                    </p>

                ) : (

                    <>

                        <div className="stock-alert-summary">

                            <div className="stock-alert-stat stock-alert-stat--critical">

                                <strong>
                                    {sinStock.length}
                                </strong>

                                <span>
                                    Sin stock
                                </span>

                            </div>


                            <div className="stock-alert-stat">

                                <strong>
                                    {stockBajo.length}
                                </strong>

                                <span>
                                    Stock bajo
                                </span>

                            </div>

                        </div>


                        <div className="stock-alert-list">

                            {alertasStock
                                .slice(0, 6)
                                .map(
                                    (producto) => (

                                        <button
                                            key={
                                                producto.id
                                            }
                                            type="button"
                                            className={
                                                producto
                                                    .stock_actual === 0
                                                    ? "stock-alert-item stock-alert-item--critical"
                                                    : "stock-alert-item"
                                            }
                                            onClick={() =>
                                                navigate(
                                                    ROUTES.stock
                                                )
                                            }
                                        >

                                            <span className="stock-alert-product">

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

                                                Stock:{" "}
                                                <strong>
                                                    {
                                                        producto.stock_actual
                                                    }
                                                </strong>

                                                {" / mín. "}

                                                {
                                                    producto.stock_minimo
                                                }

                                            </span>

                                        </button>

                                    )
                                )}

                        </div>


                        {alertasStock.length > 6 && (

                            <p className="stock-alert-more">

                                +{
                                    alertasStock.length - 6
                                } productos más

                            </p>

                        )}

                    </>

                )}

            </section>


            {/* NAVEGACIÓN */}

            <div className="dashboard-grid">

                <DashboardCard
                    title="Productos"
                    onClick={() =>
                        navigate(
                            ROUTES.productos
                        )
                    }
                />


                <DashboardCard
                    title="Stock"
                    onClick={() =>
                        navigate(
                            ROUTES.stock
                        )
                    }
                />


                <DashboardCard
                    title="Categorías"
                    onClick={() =>
                        navigate(
                            ROUTES.categorias
                        )
                    }
                />


                <DashboardCard
                    title="Subcategorías"
                    onClick={() =>
                        navigate(
                            ROUTES.subcategorias
                        )
                    }
                />
                <DashboardCard
                    title="Lista de compras"
                    onClick={() =>
                        navigate(
                            ROUTES.listaCompras
                        )
                    }
                />

            </div>

        </div>

    );

}


export default Dashboard;