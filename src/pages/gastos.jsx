import {
    useEffect,
    useState
} from "react";

import {
    useAuth
} from "../auth/authContext.jsx";

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


function Gastos() {

    const {
        puede
    } =
        useAuth();


    const puedeCrear =
        puede(
            "gastos.crear"
        );


    const puedeRevertir =
        puede(
            "gastos.revertir"
        );


    const puedeVerCaja =
        puede(
            "caja.ver"
        );

    // CAJA

    const [
        cajaActual,
        setCajaActual
    ] = useState(null);


    // CATEGORÍAS

    const [
        categorias,
        setCategorias
    ] = useState([]);

    const [
        nuevaCategoria,
        setNuevaCategoria
    ] = useState("");

    const [
        categoriaEditando,
        setCategoriaEditando
    ] = useState(null);

    const [
        nombreEditando,
        setNombreEditando
    ] = useState("");


    // NUEVO GASTO

    const [
        categoriaId,
        setCategoriaId
    ] = useState("");

    const [
        descripcion,
        setDescripcion
    ] = useState("");

    const [
        monto,
        setMonto
    ] = useState("");

    const [
        metodoPago,
        setMetodoPago
    ] = useState(
        "EFECTIVO"
    );

    const [
        fecha,
        setFecha
    ] = useState(
        fechaLocalActual()
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
        resumen,
        setResumen
    ] = useState({
        cantidad: 0,
        monto_activo: 0,
        monto_revertido: 0
    });


    // FILTROS

    const [
        filtroCategoria,
        setFiltroCategoria
    ] = useState("");

    const [
        filtroMetodo,
        setFiltroMetodo
    ] = useState("");

    const [
        filtroEstado,
        setFiltroEstado
    ] = useState("");

    const [
        busqueda,
        setBusqueda
    ] = useState("");


    // DETALLE / REVERSIÓN

    const [
        gastoDetalle,
        setGastoDetalle
    ] = useState(null);

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


    const cargarCategorias =
        async () => {

            const data =
                await window
                    .electronAPI
                    .gastos
                    .categorias
                    .listar();


            setCategorias(data);


            if (
                !categoriaId &&
                data.length > 0
            ) {

                setCategoriaId(
                    String(
                        data[0].id
                    )
                );

            }

        };


    const cargarCaja =
        async () => {

            const actual =
                await window
                    .electronAPI
                    .caja
                    .actual();


            setCajaActual(actual);

        };


    const cargarHistorial =
        async (
            paginaNueva = 1
        ) => {

            const resultado =
                await window
                    .electronAPI
                    .gastos
                    .listar({

                        pagina:
                            paginaNueva,

                        categoria_id:
                            filtroCategoria ||
                            null,

                        metodo_pago:
                            filtroMetodo ||
                            null,

                        estado:
                            filtroEstado ||
                            null,

                        busqueda:
                            busqueda.trim()

                    });


            setHistorial(
                resultado.items
            );

            setResumen(
                resultado.resumen
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

                    const tareas = [

                        cargarCategorias(),

                        cargarHistorial(1)

                    ];


                    if (puedeVerCaja) {

                        tareas.push(
                            cargarCaja()
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

    }, [puedeVerCaja]);


    const registrarGasto =
        async () => {

            if (
                guardando ||
                !cajaActual
            ) {
                return;
            }


            const montoNumero =
                Number(monto);


            if (
                !categoriaId ||
                !Number.isFinite(
                    montoNumero
                ) ||
                montoNumero <= 0
            ) {

                await window
                    .electronAPI
                    .dialogos
                    .error(
                        "Revisá la categoría y el monto."
                    );

                return;

            }


            const confirmar =
                await window
                    .electronAPI
                    .dialogos
                    .confirmar(
                        `¿Registrar gasto por ${moneda.format(
                            montoNumero
                        )}?`
                    );


            if (!confirmar) {
                return;
            }


            setGuardando(true);


            try {

                const gasto =
                    await window
                        .electronAPI
                        .gastos
                        .crear({

                            categoria_id:
                                Number(
                                    categoriaId
                                ),

                            descripcion,

                            monto:
                                montoNumero,

                            metodo_pago:
                                metodoPago,

                            fecha,

                            notas

                        });


                setGastoDetalle(
                    gasto
                );

                setDescripcion("");
                setMonto("");
                setNotas("");

                setFecha(
                    fechaLocalActual()
                );


                await Promise.all([
                    cargarHistorial(1),
                    cargarCaja()
                ]);


            } catch (error) {

                await mostrarError(
                    error
                );


            } finally {

                setGuardando(false);

            }

        };


    const aplicarFiltros =
        async (event) => {

            event.preventDefault();


            try {

                await cargarHistorial(
                    1
                );


            } catch (error) {

                await mostrarError(
                    error
                );

            }

        };


    const abrirDetalle =
        async (id) => {

            try {

                const gasto =
                    await window
                        .electronAPI
                        .gastos
                        .obtener(id);


                setGastoDetalle(
                    gasto
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


    const revertirGasto =
        async () => {

            if (
                !gastoDetalle ||
                gastoDetalle.estado !==
                "ACTIVO" ||
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
                        "Debe indicar el motivo de la reversión."
                    );

                return;

            }


            const confirmar =
                await window
                    .electronAPI
                    .dialogos
                    .confirmar(
                        `¿Revertir el gasto #${gastoDetalle.id} por ${moneda.format(
                            gastoDetalle.monto
                        )}?`
                    );


            if (!confirmar) {
                return;
            }


            setRevirtiendo(true);


            try {

                const gasto =
                    await window
                        .electronAPI
                        .gastos
                        .revertir({

                            id:
                                gastoDetalle.id,

                            motivo

                        });


                setGastoDetalle(
                    gasto
                );

                setMotivoReversion(
                    ""
                );


                await Promise.all([
                    cargarHistorial(1),
                    cargarCaja()
                ]);


            } catch (error) {

                await mostrarError(
                    error
                );


            } finally {

                setRevirtiendo(false);

            }

        };


    /*
     * CATEGORÍAS
     */

    const crearCategoria =
        async () => {

            const nombre =
                nuevaCategoria.trim();


            if (nombre.length < 2) {
                return;
            }


            try {

                await window
                    .electronAPI
                    .gastos
                    .categorias
                    .crear({
                        nombre
                    });


                setNuevaCategoria("");

                await cargarCategorias();


            } catch (error) {

                await mostrarError(
                    error
                );

            }

        };


    const comenzarEdicion =
        (categoria) => {

            setCategoriaEditando(
                categoria.id
            );

            setNombreEditando(
                categoria.nombre
            );

        };


    const guardarCategoria =
        async () => {

            if (!categoriaEditando) {
                return;
            }


            try {

                await window
                    .electronAPI
                    .gastos
                    .categorias
                    .actualizar({

                        id:
                            categoriaEditando,

                        nombre:
                            nombreEditando

                    });


                setCategoriaEditando(
                    null
                );

                setNombreEditando(
                    ""
                );


                await cargarCategorias();


            } catch (error) {

                await mostrarError(
                    error
                );

            }

        };


    const eliminarCategoria =
        async (categoria) => {

            const confirmar =
                await window
                    .electronAPI
                    .dialogos
                    .confirmar(
                        `¿Desactivar la categoría "${categoria.nombre}"? Los gastos anteriores conservarán ese nombre.`
                    );


            if (!confirmar) {
                return;
            }


            try {

                await window
                    .electronAPI
                    .gastos
                    .categorias
                    .eliminar(
                        categoria.id
                    );


                if (
                    String(
                        categoria.id
                    ) ===
                    categoriaId
                ) {

                    setCategoriaId("");

                }


                await cargarCategorias();


            } catch (error) {

                await mostrarError(
                    error
                );

            }

        };


    return (

        <div className="page">

            <PageHeader
                title="Gastos"
            />


            {puedeCrear ||  puedeRevertir && (!cajaActual ? (

                <div className="expense-warning">

                    <strong>
                        No hay una caja abierta.
                    </strong>

                    <p>
                        Abrí una caja antes de registrar o revertir gastos.
                    </p>

                </div>

            ) : (

                <p>
                    Caja abierta:{" "}
                    <strong>
                        #{cajaActual.id}
                    </strong>
                </p>
            )
        )}

            


            {/* NUEVO GASTO */}
            {puedeCrear && (
            <section>

                <h2>
                    Registrar gasto
                </h2>


                <div className="expense-form-grid">

                    <div className="form-field">

                        <label>
                            Categoría
                        </label>

                        <select
                            value={
                                categoriaId
                            }
                            onChange={(event) =>
                                setCategoriaId(
                                    event.target.value
                                )
                            }
                        >

                            <option value="">
                                Seleccionar
                            </option>


                            {categorias.map(
                                (categoria) => (

                                    <option
                                        key={
                                            categoria.id
                                        }
                                        value={
                                            categoria.id
                                        }
                                    >
                                        {
                                            categoria.nombre
                                        }
                                    </option>

                                )
                            )}

                        </select>

                    </div>


                    <div className="form-field">

                        <label>
                            Monto
                        </label>

                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={monto}
                            onChange={(event) =>
                                setMonto(
                                    event.target.value
                                )
                            }
                        />

                    </div>


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
                        Descripción
                    </label>

                    <input
                        value={descripcion}
                        onChange={(event) =>
                            setDescripcion(
                                event.target.value
                            )
                        }
                        placeholder="Ej: bolsas, reparación de heladera..."
                    />

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
                        !cajaActual ||
                        guardando
                    }
                    onClick={
                        registrarGasto
                    }
                >
                    {
                        guardando
                            ? "Registrando..."
                            : "Registrar gasto"
                    }
                </button>

            </section>
            )}


            {/* CATEGORÍAS */}
            {puedeCrear && (
            <section className="expense-categories">

                <h2>
                    Categorías
                </h2>


                <div className="expense-category-new">

                    <input
                        value={
                            nuevaCategoria
                        }
                        onChange={(event) =>
                            setNuevaCategoria(
                                event.target.value
                            )
                        }
                        placeholder="Nueva categoría"
                    />

                    <button
                        type="button"
                        onClick={
                            crearCategoria
                        }
                    >
                        Agregar
                    </button>

                </div>


                {categorias.map(
                    (categoria) => (

                        <div
                            key={
                                categoria.id
                            }
                            className="expense-category-row"
                        >

                            {
                                categoriaEditando ===
                                    categoria.id
                                    ? (

                                        <>

                                            <input
                                                value={
                                                    nombreEditando
                                                }
                                                onChange={(event) =>
                                                    setNombreEditando(
                                                        event.target.value
                                                    )
                                                }
                                            />

                                            <button
                                                type="button"
                                                onClick={
                                                    guardarCategoria
                                                }
                                            >
                                                Guardar
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setCategoriaEditando(
                                                        null
                                                    )
                                                }
                                            >
                                                Cancelar
                                            </button>

                                        </>

                                    )
                                    : (

                                        <>

                                            <span>
                                                {
                                                    categoria.nombre
                                                }
                                            </span>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    comenzarEdicion(
                                                        categoria
                                                    )
                                                }
                                            >
                                                Renombrar
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    eliminarCategoria(
                                                        categoria
                                                    )
                                                }
                                            >
                                                Desactivar
                                            </button>

                                        </>

                                    )
                            }

                        </div>

                    )
                )}

            </section>
            )}

            {/* FILTROS */}

            <section>

                <h2>
                    Historial
                </h2>


                <form
                    className="expense-filters"
                    onSubmit={
                        aplicarFiltros
                    }
                >

                    <input
                        value={busqueda}
                        onChange={(event) =>
                            setBusqueda(
                                event.target.value
                            )
                        }
                        placeholder="Buscar..."
                    />


                    <select
                        value={
                            filtroCategoria
                        }
                        onChange={(event) =>
                            setFiltroCategoria(
                                event.target.value
                            )
                        }
                    >
                        <option value="">
                            Todas las categorías
                        </option>

                        {categorias.map(
                            (categoria) => (

                                <option
                                    key={
                                        categoria.id
                                    }
                                    value={
                                        categoria.id
                                    }
                                >
                                    {
                                        categoria.nombre
                                    }
                                </option>

                            )
                        )}
                    </select>


                    <select
                        value={filtroMetodo}
                        onChange={(event) =>
                            setFiltroMetodo(
                                event.target.value
                            )
                        }
                    >
                        <option value="">
                            Todos los métodos
                        </option>

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


                    <select
                        value={filtroEstado}
                        onChange={(event) =>
                            setFiltroEstado(
                                event.target.value
                            )
                        }
                    >
                        <option value="">
                            Todos los estados
                        </option>

                        <option value="ACTIVO">
                            Activos
                        </option>

                        <option value="REVERTIDO">
                            Revertidos
                        </option>
                    </select>


                    <button type="submit">
                        Filtrar
                    </button>

                </form>


                <div className="expense-summary">

                    <div>
                        <span>
                            Gastos activos
                        </span>

                        <strong>
                            {
                                moneda.format(
                                    resumen.monto_activo ||
                                    0
                                )
                            }
                        </strong>
                    </div>


                    <div>
                        <span>
                            Revertidos
                        </span>

                        <strong>
                            {
                                moneda.format(
                                    resumen.monto_revertido ||
                                    0
                                )
                            }
                        </strong>
                    </div>

                </div>


                <div className="expense-history">

                    {historial.map(
                        (gasto) => (

                            <button
                                key={
                                    gasto.id
                                }
                                type="button"
                                onClick={() =>
                                    abrirDetalle(
                                        gasto.id
                                    )
                                }
                            >

                                <span>
                                    #{gasto.id}
                                    {" · "}
                                    {gasto.categoria}
                                    {" · "}
                                    {gasto.estado}
                                </span>

                                <span>
                                    {
                                        gasto.descripcion ||
                                        "Sin descripción"
                                    }
                                </span>

                                <span>
                                    {
                                        gasto.metodo_pago
                                    }
                                </span>

                                <strong>
                                    {
                                        moneda.format(
                                            gasto.monto
                                        )
                                    }
                                </strong>

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

            {gastoDetalle && (

                <section className="expense-detail">

                    <h2>
                        Gasto #{gastoDetalle.id}
                    </h2>


                    <p>
                        Categoría:{" "}
                        <strong>
                            {
                                gastoDetalle.categoria
                            }
                        </strong>
                    </p>


                    <p>
                        Monto:{" "}
                        <strong>
                            {
                                moneda.format(
                                    gastoDetalle.monto
                                )
                            }
                        </strong>
                    </p>


                    <p>
                        Método:{" "}
                        {
                            gastoDetalle.metodo_pago
                        }
                    </p>


                    <p>
                        Estado:{" "}
                        <strong>
                            {
                                gastoDetalle.estado
                            }
                        </strong>
                    </p>


                    <h3>
                        Movimientos de caja
                    </h3>


                    {gastoDetalle.movimientos.map(
                        (movimiento) => (

                            <div
                                key={
                                    movimiento.id
                                }
                            >
                                {
                                    movimiento.tipo
                                }
                                {" · "}
                                {
                                    moneda.format(
                                        movimiento.monto
                                    )
                                }
                                {" · Caja #"}
                                {
                                    movimiento.caja_id
                                }
                            </div>

                        )
                    )}


                    {gastoDetalle.estado ===
                        "REVERTIDO" && (

                            <div>

                                <p>
                                    Revertido:{" "}
                                    {
                                        new Date(
                                            gastoDetalle
                                                .fecha_reversion
                                        )
                                            .toLocaleString(
                                                "es-AR"
                                            )
                                    }
                                </p>

                                <p>
                                    Motivo:{" "}
                                    {
                                        gastoDetalle
                                            .motivo_reversion
                                    }
                                </p>

                            </div>

                        )}


                    {puedeRevertir && gastoDetalle.estado ===
                        "ACTIVO" && (

                            <div className="expense-reversal">

                                <h3>
                                    Revertir gasto
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
                                    placeholder="Motivo de la reversión"
                                />


                                <button
                                    type="button"
                                    disabled={
                                        !cajaActual ||
                                        revirtiendo
                                    }
                                    onClick={
                                        revertirGasto
                                    }
                                >
                                    {
                                        revirtiendo
                                            ? "Revirtiendo..."
                                            : "Revertir gasto"
                                    }
                                </button>

                            </div>

                        )}

                </section>

            )}

        </div>

    );

}


export default Gastos;