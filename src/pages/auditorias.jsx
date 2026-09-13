import {
    useEffect,
    useState
} from "react";

import PageHeader
    from "../components/pageHeader.jsx";

import "../styles/auditoria.css";


function fechaPrimerDiaMes() {

    const ahora =
        new Date();


    const fecha =
        new Date(
            ahora.getFullYear(),
            ahora.getMonth(),
            1
        );


    const offset =
        fecha.getTimezoneOffset();


    fecha.setMinutes(
        fecha.getMinutes() -
        offset
    );


    return fecha
        .toISOString()
        .slice(
            0,
            10
        );

}


function fechaHoy() {

    const fecha =
        new Date();


    fecha.setMinutes(
        fecha.getMinutes() -
        fecha.getTimezoneOffset()
    );


    return fecha
        .toISOString()
        .slice(
            0,
            10
        );

}


function Auditoria() {

    const [
        items,
        setItems
    ] = useState([]);


    const [
        desde,
        setDesde
    ] = useState(
        fechaPrimerDiaMes()
    );


    const [
        hasta,
        setHasta
    ] = useState(
        fechaHoy()
    );


    const [
        modulo,
        setModulo
    ] = useState("");


    const [
        pagina,
        setPagina
    ] = useState(1);


    const [
        totalPaginas,
        setTotalPaginas
    ] = useState(1);


    const [
        cargando,
        setCargando
    ] = useState(false);


    const cargar =
        async (
            paginaNueva = 1
        ) => {

            setCargando(true);


            try {

                const resultado =
                    await window
                        .electronAPI
                        .auditoria
                        .listar({

                            desde,
                            hasta,

                            modulo:
                                modulo ||
                                null,

                            pagina:
                                paginaNueva,

                            limite:
                                50

                        });


                setItems(
                    resultado.items
                );


                setPagina(
                    resultado.pagina
                );


                setTotalPaginas(
                    resultado.totalPaginas
                );


            } finally {

                setCargando(false);

            }

        };


    useEffect(() => {

        cargar(1);

    }, []);


    const filtrar =
        async (event) => {

            event.preventDefault();

            await cargar(1);

        };


    return (

        <div className="page">

            <PageHeader
                title="Auditoría"
            />


            <form
                className="audit-filter"
                onSubmit={
                    filtrar
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


                <div className="form-field">

                    <label>
                        Módulo
                    </label>

                    <select
                        value={modulo}
                        onChange={(event) =>
                            setModulo(
                                event.target.value
                            )
                        }
                    >

                        <option value="">
                            Todos
                        </option>

                        <option value="VENTAS">
                            Ventas
                        </option>

                        <option value="COMPRAS">
                            Compras
                        </option>

                        <option value="CAJA">
                            Caja
                        </option>

                        <option value="GASTOS">
                            Gastos
                        </option>

                        <option value="STOCK">
                            Stock
                        </option>

                        <option value="PRECIOS">
                            Precios
                        </option>

                        <option value="USUARIOS">
                            Usuarios
                        </option>

                    </select>

                </div>


                <button
                    type="submit"
                    disabled={
                        cargando
                    }
                >
                    Actualizar
                </button>

            </form>


            <div className="audit-table-wrapper">

                <table className="audit-table">

                    <thead>

                        <tr>
                            <th>Fecha</th>
                            <th>Usuario</th>
                            <th>Módulo</th>
                            <th>Acción</th>
                            <th>Entidad</th>
                            <th>Descripción</th>
                            <th>Detalles</th>
                        </tr>

                    </thead>


                    <tbody>

                        {items.length === 0 ? (

                            <tr>

                                <td colSpan="7">
                                    No hay eventos.
                                </td>

                            </tr>

                        ) : (

                            items.map(
                                (item) => (

                                    <tr
                                        key={
                                            item.id
                                        }
                                    >

                                        <td>
                                            {
                                                new Date(
                                                    item.fecha
                                                )
                                                    .toLocaleString(
                                                        "es-AR"
                                                    )
                                            }
                                        </td>


                                        <td>
                                            {
                                                item.usuario_nombre ||
                                                item.usuario ||
                                                "Sistema"
                                            }
                                        </td>


                                        <td>
                                            {item.modulo}
                                        </td>


                                        <td>
                                            {item.accion}
                                        </td>


                                        <td>

                                            {
                                                item.entidad
                                                    ? (
                                                        `${item.entidad}${item.entidad_id
                                                            ? ` #${item.entidad_id}`
                                                            : ""
                                                        }`
                                                    )
                                                    : "—"
                                            }

                                        </td>


                                        <td>
                                            {
                                                item.descripcion ||
                                                "—"
                                            }
                                        </td>


                                        <td>

                                            {item.detalles ? (

                                                <details>

                                                    <summary>
                                                        Ver
                                                    </summary>

                                                    <pre>
                                                        {
                                                            JSON.stringify(
                                                                item.detalles,
                                                                null,
                                                                2
                                                            )
                                                        }
                                                    </pre>

                                                </details>

                                            ) : "—"}

                                        </td>

                                    </tr>

                                )
                            )

                        )}

                    </tbody>

                </table>

            </div>


            <div className="pagination">

                <button
                    type="button"
                    disabled={
                        pagina <= 1
                    }
                    onClick={() =>
                        cargar(
                            pagina - 1
                        )
                    }
                >
                    ← Anterior
                </button>


                <span>
                    Página {pagina} de {totalPaginas}
                </span>


                <button
                    type="button"
                    disabled={
                        pagina >=
                        totalPaginas
                    }
                    onClick={() =>
                        cargar(
                            pagina + 1
                        )
                    }
                >
                    Siguiente →
                </button>

            </div>

        </div>

    );

}


export default Auditoria;