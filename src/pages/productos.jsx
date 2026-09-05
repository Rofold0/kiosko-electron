import {
    useEffect,
    useState
} from "react";

import PageHeader
    from "../components/pageHeader.jsx";

import CrudTable
    from "../components/crudTable.jsx";

import FormActions
    from "../components/formActions.jsx";


const LIMITE = 50;


const columnasProductos = [
    {
        key: "codigo",
        label: "Código",
        render: (producto) =>
            producto.codigo || "—"
    },
    {
        key: "nombre",
        label: "Producto"
    },
    {
        key: "categoria_nombre",
        label: "Categoría",
        render: (producto) =>
            producto.categoria_nombre || "—"
    },
    {
        key: "subcategoria_nombre",
        label: "Subcategoría",
        render: (producto) =>
            producto.subcategoria_nombre || "—"
    },
    {
        key: "stock_actual",
        label: "Stock"
    },
    {
        key: "stock_minimo",
        label: "Mínimo"
    },
    {
        key: "unidad",
        label: "Unidad"
    }
];


const filtrosVacios = {
    busqueda: "",
    categoria_id: null,
    subcategoria_id: null
};


function Productos() {

    // LISTADO

    const [
        productos,
        setProductos
    ] = useState([]);

    const [
        categorias,
        setCategorias
    ] = useState([]);

    const [
        subcategorias,
        setSubcategorias
    ] = useState([]);


    // PAGINACIÓN

    const [
        pagina,
        setPagina
    ] = useState(1);

    const [
        totalPaginas,
        setTotalPaginas
    ] = useState(1);

    const [
        total,
        setTotal
    ] = useState(0);


    // FILTROS VISIBLES

    const [
        busqueda,
        setBusqueda
    ] = useState("");

    const [
        categoriaFiltro,
        setCategoriaFiltro
    ] = useState("");

    const [
        subcategoriaFiltro,
        setSubcategoriaFiltro
    ] = useState("");


    // FILTROS REALMENTE APLICADOS

    const [
        filtrosActivos,
        setFiltrosActivos
    ] = useState(
        filtrosVacios
    );


    // FORMULARIO

    const [
        nombre,
        setNombre
    ] = useState("");

    const [
        descripcion,
        setDescripcion
    ] = useState("");

    const [
        codigo,
        setCodigo
    ] = useState("");

    const [
        categoriaId,
        setCategoriaId
    ] = useState("");

    const [
        subcategoriaId,
        setSubcategoriaId
    ] = useState("");

    const [
        stockInicial,
        setStockInicial
    ] = useState("0");

    const [
        stockActual,
        setStockActual
    ] = useState(null);

    const [
        stockMinimo,
        setStockMinimo
    ] = useState("0");

    const [
        unidad,
        setUnidad
    ] = useState("unidad");

    const [
        editandoId,
        setEditandoId
    ] = useState(null);

    const [
        guardando,
        setGuardando
    ] = useState(false);


    // SUBCATEGORÍAS DEL FORMULARIO

    const subcategoriasFormulario =
        subcategorias.filter(
            (subcategoria) =>
                String(
                    subcategoria.categoria_id
                ) ===
                String(categoriaId)
        );


    // SUBCATEGORÍAS DE LOS FILTROS

    const subcategoriasFiltro =
        subcategorias.filter(
            (subcategoria) =>
                String(
                    subcategoria.categoria_id
                ) ===
                String(categoriaFiltro)
        );


    // MOSTRAR ERROR

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


    // CARGAR PRODUCTOS

    const cargarProductos =
        async (
            paginaObjetivo = 1,
            filtros = filtrosActivos
        ) => {

            try {

                const resultado =
                    await window.electronAPI
                        .productos
                        .listar({
                            ...filtros,
                            pagina:
                                paginaObjetivo,
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

                setTotal(
                    resultado.total
                );


            } catch (error) {

                await mostrarError(
                    error
                );

            }

        };


    // CARGA INICIAL

    useEffect(() => {

        const iniciar =
            async () => {

                try {

                    const [
                        categoriasData,
                        subcategoriasData,
                        productosData
                    ] =
                        await Promise.all([

                            window.electronAPI
                                .categorias
                                .listar(),

                            window.electronAPI
                                .subcategorias
                                .listar(),

                            window.electronAPI
                                .productos
                                .listar({
                                    ...filtrosVacios,
                                    pagina: 1,
                                    limite: LIMITE
                                })

                        ]);


                    setCategorias(
                        categoriasData
                    );

                    setSubcategorias(
                        subcategoriasData
                    );

                    setProductos(
                        productosData.items
                    );

                    setPagina(
                        productosData.pagina
                    );

                    setTotalPaginas(
                        productosData.totalPaginas
                    );

                    setTotal(
                        productosData.total
                    );


                } catch (error) {

                    await mostrarError(
                        error
                    );

                }

            };


        iniciar();

    }, []);


    // LIMPIAR FORMULARIO

    const limpiarFormulario = () => {

        setNombre("");

        setDescripcion("");

        setCodigo("");

        setCategoriaId("");

        setSubcategoriaId("");

        setStockInicial("0");

        setStockActual(null);

        setStockMinimo("0");

        setUnidad("unidad");

        setEditandoId(null);

    };


    // CAMBIO CATEGORÍA FORMULARIO

    const cambiarCategoria =
        (valor) => {

            setCategoriaId(
                valor
            );

            setSubcategoriaId("");

        };


    // GUARDAR

    const guardarProducto =
        async (e) => {

            e.preventDefault();


            if (guardando) {
                return;
            }


            setGuardando(true);


            const datos = {

                nombre,

                descripcion,

                codigo,

                categoria_id:
                    categoriaId,

                subcategoria_id:
                    subcategoriaId ||
                    null,

                stock_minimo:
                    Number(
                        stockMinimo
                    ),

                unidad

            };


            try {

                if (editandoId) {

                    await window.electronAPI
                        .productos
                        .actualizar({
                            id:
                                editandoId,
                            ...datos
                        });


                    limpiarFormulario();


                    await cargarProductos(
                        pagina
                    );


                } else {

                    await window.electronAPI
                        .productos
                        .crear({
                            ...datos,

                            stock_inicial:
                                Number(
                                    stockInicial
                                )
                        });


                    limpiarFormulario();


                    await cargarProductos(
                        1
                    );

                }


            } catch (error) {

                await mostrarError(
                    error
                );


            } finally {

                setGuardando(false);

            }

        };


    // EDITAR

    const editarProducto =
        (producto) => {

            setEditandoId(
                producto.id
            );

            setNombre(
                producto.nombre
            );

            setDescripcion(
                producto.descripcion || ""
            );

            setCodigo(
                producto.codigo || ""
            );

            setCategoriaId(
                String(
                    producto.categoria_id ||
                    ""
                )
            );

            setSubcategoriaId(
                String(
                    producto.subcategoria_id ||
                    ""
                )
            );

            setStockActual(
                producto.stock_actual
            );

            setStockMinimo(
                String(
                    producto.stock_minimo
                )
            );

            setUnidad(
                producto.unidad ||
                "unidad"
            );

        };


    // ELIMINAR

    const eliminarProducto =
        async (id) => {

            const confirmar =
                await window.electronAPI
                    .dialogos
                    .confirmar(
                        "¿Está seguro de eliminar este producto?"
                    );


            if (!confirmar) {
                return;
            }


            try {

                await window.electronAPI
                    .productos
                    .eliminar(id);


                if (
                    editandoId === id
                ) {

                    limpiarFormulario();

                }


                const paginaObjetivo =
                    productos.length === 1 &&
                    pagina > 1
                        ? pagina - 1
                        : pagina;


                await cargarProductos(
                    paginaObjetivo
                );


            } catch (error) {

                await mostrarError(
                    error
                );

            }

        };


    // BUSCAR / FILTRAR

    const aplicarFiltros =
        async (e) => {

            e.preventDefault();


            const nuevosFiltros = {

                busqueda:
                    busqueda.trim(),

                categoria_id:
                    categoriaFiltro ||
                    null,

                subcategoria_id:
                    subcategoriaFiltro ||
                    null

            };


            setFiltrosActivos(
                nuevosFiltros
            );


            await cargarProductos(
                1,
                nuevosFiltros
            );

        };


    // LIMPIAR FILTROS

    const limpiarFiltros =
        async () => {

            setBusqueda("");

            setCategoriaFiltro("");

            setSubcategoriaFiltro("");

            setFiltrosActivos(
                filtrosVacios
            );


            await cargarProductos(
                1,
                filtrosVacios
            );

        };


    // CAMBIAR CATEGORÍA DE FILTRO

    const cambiarCategoriaFiltro =
        (valor) => {

            setCategoriaFiltro(
                valor
            );

            setSubcategoriaFiltro("");

        };


    // PAGINACIÓN

    const paginaAnterior = () => {

        if (pagina > 1) {

            cargarProductos(
                pagina - 1
            );

        }

    };


    const paginaSiguiente = () => {

        if (
            pagina < totalPaginas
        ) {

            cargarProductos(
                pagina + 1
            );

        }

    };


    return (

        <div className="page">

            <PageHeader
                title="Productos"
            />


            {/* FORMULARIO */}

            <section>

                <h2>
                    {
                        editandoId
                            ? "Editar producto"
                            : "Nuevo producto"
                    }
                </h2>


                <form
                    className="product-form"
                    onSubmit={
                        guardarProducto
                    }
                >

                    <div className="form-field">

                        <label htmlFor="producto-nombre">
                            Nombre
                        </label>

                        <input
                            id="producto-nombre"
                            type="text"
                            value={nombre}
                            onChange={(e) =>
                                setNombre(
                                    e.target.value
                                )
                            }
                            required
                        />

                    </div>


                    <div className="form-field">

                        <label htmlFor="producto-codigo">
                            Código
                        </label>

                        <input
                            id="producto-codigo"
                            type="text"
                            value={codigo}
                            onChange={(e) =>
                                setCodigo(
                                    e.target.value
                                )
                            }
                            placeholder="Opcional"
                        />

                    </div>


                    <div className="form-field">

                        <label htmlFor="producto-categoria">
                            Categoría
                        </label>

                        <select
                            id="producto-categoria"
                            value={categoriaId}
                            onChange={(e) =>
                                cambiarCategoria(
                                    e.target.value
                                )
                            }
                            required
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

                        <label htmlFor="producto-subcategoria">
                            Subcategoría
                        </label>

                        <select
                            id="producto-subcategoria"
                            value={subcategoriaId}
                            onChange={(e) =>
                                setSubcategoriaId(
                                    e.target.value
                                )
                            }
                            disabled={
                                !categoriaId
                            }
                        >

                            <option value="">
                                Sin subcategoría
                            </option>

                            {
                                subcategoriasFormulario
                                    .map(
                                        (subcategoria) => (

                                            <option
                                                key={
                                                    subcategoria.id
                                                }
                                                value={
                                                    subcategoria.id
                                                }
                                            >
                                                {
                                                    subcategoria.nombre
                                                }
                                            </option>

                                        )
                                    )
                            }

                        </select>

                    </div>


                    {
                        editandoId
                            ? (

                                <div className="form-field">

                                    <label>
                                        Stock actual
                                    </label>

                                    <input
                                        type="number"
                                        value={
                                            stockActual ??
                                            0
                                        }
                                        disabled
                                    />

                                </div>

                            )
                            : (

                                <div className="form-field">

                                    <label htmlFor="producto-stock-inicial">
                                        Stock inicial
                                    </label>

                                    <input
                                        id="producto-stock-inicial"
                                        type="number"
                                        min="0"
                                        step="1"
                                        value={
                                            stockInicial
                                        }
                                        onChange={(e) =>
                                            setStockInicial(
                                                e.target.value
                                            )
                                        }
                                        required
                                    />

                                </div>

                            )
                    }


                    <div className="form-field">

                        <label htmlFor="producto-stock-minimo">
                            Stock mínimo
                        </label>

                        <input
                            id="producto-stock-minimo"
                            type="number"
                            min="0"
                            step="1"
                            value={
                                stockMinimo
                            }
                            onChange={(e) =>
                                setStockMinimo(
                                    e.target.value
                                )
                            }
                            required
                        />

                    </div>


                    <div className="form-field">

                        <label htmlFor="producto-unidad">
                            Unidad
                        </label>

                        <input
                            id="producto-unidad"
                            type="text"
                            value={unidad}
                            onChange={(e) =>
                                setUnidad(
                                    e.target.value
                                )
                            }
                            placeholder="unidad"
                            required
                        />

                    </div>


                    <div className="form-field product-description">

                        <label htmlFor="producto-descripcion">
                            Descripción
                        </label>

                        <textarea
                            id="producto-descripcion"
                            value={
                                descripcion
                            }
                            onChange={(e) =>
                                setDescripcion(
                                    e.target.value
                                )
                            }
                            rows="3"
                            placeholder="Opcional"
                        />

                    </div>


                    <FormActions
                        editando={
                            Boolean(
                                editandoId
                            )
                        }
                        onCancel={
                            limpiarFormulario
                        }
                        disabled={
                            guardando
                        }
                    />

                </form>

            </section>


            {/* FILTROS */}

            <section>

                <h2>
                    Lista de productos
                </h2>


                <form
                    className="product-filters"
                    onSubmit={
                        aplicarFiltros
                    }
                >

                    <div className="form-field">

                        <label htmlFor="producto-busqueda">
                            Buscar
                        </label>

                        <input
                            id="producto-busqueda"
                            type="search"
                            value={busqueda}
                            onChange={(e) =>
                                setBusqueda(
                                    e.target.value
                                )
                            }
                            placeholder="Nombre o código"
                        />

                    </div>


                    <div className="form-field">

                        <label htmlFor="filtro-categoria">
                            Categoría
                        </label>

                        <select
                            id="filtro-categoria"
                            value={
                                categoriaFiltro
                            }
                            onChange={(e) =>
                                cambiarCategoriaFiltro(
                                    e.target.value
                                )
                            }
                        >

                            <option value="">
                                Todas
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

                        <label htmlFor="filtro-subcategoria">
                            Subcategoría
                        </label>

                        <select
                            id="filtro-subcategoria"
                            value={
                                subcategoriaFiltro
                            }
                            onChange={(e) =>
                                setSubcategoriaFiltro(
                                    e.target.value
                                )
                            }
                            disabled={
                                !categoriaFiltro
                            }
                        >

                            <option value="">
                                Todas
                            </option>

                            {
                                subcategoriasFiltro
                                    .map(
                                        (subcategoria) => (

                                            <option
                                                key={
                                                    subcategoria.id
                                                }
                                                value={
                                                    subcategoria.id
                                                }
                                            >
                                                {
                                                    subcategoria.nombre
                                                }
                                            </option>

                                        )
                                    )
                            }

                        </select>

                    </div>


                    <div className="filter-actions">

                        <button
                            type="submit"
                        >
                            Buscar
                        </button>

                        <button
                            type="button"
                            onClick={
                                limpiarFiltros
                            }
                        >
                            Limpiar
                        </button>

                    </div>

                </form>


                <p className="product-count">
                    {total} producto
                    {total !== 1 && "s"}
                </p>


                <CrudTable
                    columns={
                        columnasProductos
                    }
                    items={
                        productos
                    }
                    onEdit={
                        editarProducto
                    }
                    onDelete={
                        eliminarProducto
                    }
                    emptyMessage=
                        "No hay productos."
                />


                <div className="pagination">

                    <button
                        type="button"
                        onClick={
                            paginaAnterior
                        }
                        disabled={
                            pagina <= 1
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
                        onClick={
                            paginaSiguiente
                        }
                        disabled={
                            pagina >=
                            totalPaginas
                        }
                    >
                        Siguiente →
                    </button>

                </div>

            </section>

        </div>

    );

}


export default Productos;