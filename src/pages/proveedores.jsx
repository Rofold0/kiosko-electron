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


function Proveedores() {

    const [
        proveedores,
        setProveedores
    ] = useState([]);


    const [
        nombre,
        setNombre
    ] = useState("");

    const [
        telefono,
        setTelefono
    ] = useState("");

    const [
        direccion,
        setDireccion
    ] = useState("");

    const [
        notas,
        setNotas
    ] = useState("");

    const [
        editandoId,
        setEditandoId
    ] = useState(null);


    const [
        proveedorSeleccionado,
        setProveedorSeleccionado
    ] = useState(null);

    const [
        productosProveedor,
        setProductosProveedor
    ] = useState([]);


    // BUSCAR PRODUCTO

    const [
        busqueda,
        setBusqueda
    ] = useState("");

    const [
        resultados,
        setResultados
    ] = useState([]);

    const [
        productoSeleccionado,
        setProductoSeleccionado
    ] = useState(null);


    // VÍNCULO

    const [
        vinculoId,
        setVinculoId
    ] = useState(null);

    const [
        codigoProveedor,
        setCodigoProveedor
    ] = useState("");

    const [
        ultimoCosto,
        setUltimoCosto
    ] = useState("");

    const [
        notasVinculo,
        setNotasVinculo
    ] = useState("");


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


    const cargarProveedores =
        async () => {

            const data =
                await window
                    .electronAPI
                    .proveedores
                    .listar();


            setProveedores(data);

        };


    useEffect(() => {

        cargarProveedores()
            .catch(
                mostrarError
            );

    }, []);


    const limpiarFormulario =
        () => {

            setNombre("");

            setTelefono("");

            setDireccion("");

            setNotas("");

            setEditandoId(null);

        };


    const guardarProveedor =
        async (e) => {

            e.preventDefault();


            try {

                const datos = {

                    nombre,
                    telefono,
                    direccion,
                    notas

                };


                if (editandoId) {

                    await window
                        .electronAPI
                        .proveedores
                        .actualizar({

                            id:
                                editandoId,

                            ...datos

                        });


                } else {

                    await window
                        .electronAPI
                        .proveedores
                        .crear(datos);

                }


                limpiarFormulario();

                await cargarProveedores();


            } catch (error) {

                await mostrarError(
                    error
                );

            }

        };


    const editarProveedor =
        (proveedor) => {

            setEditandoId(
                proveedor.id
            );

            setNombre(
                proveedor.nombre
            );

            setTelefono(
                proveedor.telefono ||
                ""
            );

            setDireccion(
                proveedor.direccion ||
                ""
            );

            setNotas(
                proveedor.notas ||
                ""
            );

        };


    const eliminarProveedor =
        async (id) => {

            const confirmar =
                await window
                    .electronAPI
                    .dialogos
                    .confirmar(
                        "¿Eliminar este proveedor?"
                    );


            if (!confirmar) {
                return;
            }


            try {

                await window
                    .electronAPI
                    .proveedores
                    .eliminar(id);


                if (
                    proveedorSeleccionado
                        ?.id === id
                ) {

                    setProveedorSeleccionado(
                        null
                    );

                    setProductosProveedor([]);

                }


                await cargarProveedores();


            } catch (error) {

                await mostrarError(
                    error
                );

            }

        };


    const cargarProductosProveedor =
        async (proveedorId) => {

            const data =
                await window
                    .electronAPI
                    .proveedores
                    .productos(
                        proveedorId
                    );


            setProductosProveedor(
                data
            );

        };


    const seleccionarProveedor =
        async (proveedor) => {

            setProveedorSeleccionado(
                proveedor
            );

            setProductoSeleccionado(
                null
            );

            setResultados([]);

            setBusqueda("");

            limpiarVinculo();


            try {

                await cargarProductosProveedor(
                    proveedor.id
                );


            } catch (error) {

                await mostrarError(
                    error
                );

            }

        };


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


    function limpiarVinculo() {

        setVinculoId(null);

        setProductoSeleccionado(
            null
        );

        setCodigoProveedor("");

        setUltimoCosto("");

        setNotasVinculo("");

    }


    const elegirProducto =
        (producto) => {

            limpiarVinculo();

            setProductoSeleccionado(
                producto
            );

        };


    const guardarVinculo =
        async (e) => {

            e.preventDefault();


            if (
                !proveedorSeleccionado ||
                !productoSeleccionado
            ) {

                return;

            }


            try {

                const datos = {

                    codigo_proveedor:
                        codigoProveedor,

                    ultimo_costo:
                        ultimoCosto,

                    notas:
                        notasVinculo

                };


                if (vinculoId) {

                    await window
                        .electronAPI
                        .proveedores
                        .actualizarVinculo({

                            id:
                                vinculoId,

                            ...datos

                        });


                } else {

                    await window
                        .electronAPI
                        .proveedores
                        .vincularProducto({

                            proveedor_id:
                                proveedorSeleccionado
                                    .id,

                            producto_id:
                                productoSeleccionado
                                    .id,

                            ...datos

                        });

                }


                limpiarVinculo();

                setResultados([]);

                setBusqueda("");


                await cargarProductosProveedor(
                    proveedorSeleccionado.id
                );


            } catch (error) {

                await mostrarError(
                    error
                );

            }

        };


    const editarVinculo =
        (vinculo) => {

            setVinculoId(
                vinculo.id
            );


            setProductoSeleccionado({

                id:
                    vinculo.producto_id,

                nombre:
                    vinculo.producto_nombre,

                codigo:
                    vinculo.producto_codigo

            });


            setCodigoProveedor(
                vinculo.codigo_proveedor ||
                ""
            );

            setUltimoCosto(
                vinculo.ultimo_costo ??
                ""
            );

            setNotasVinculo(
                vinculo.notas ||
                ""
            );

        };


    const desvincularProducto =
        async (id) => {

            const confirmar =
                await window
                    .electronAPI
                    .dialogos
                    .confirmar(
                        "¿Quitar este producto del proveedor?"
                    );


            if (!confirmar) {
                return;
            }


            try {

                await window
                    .electronAPI
                    .proveedores
                    .desvincularProducto(
                        id
                    );


                limpiarVinculo();


                await cargarProductosProveedor(
                    proveedorSeleccionado.id
                );


            } catch (error) {

                await mostrarError(
                    error
                );

            }

        };


    const columnasProveedores = [

        {
            key: "nombre",
            label: "Proveedor"
        },

        {
            key: "telefono",
            label: "Teléfono",

            render: (item) =>
                item.telefono ||
                "—"
        },

        {
            key: "direccion",
            label: "Dirección",

            render: (item) =>
                item.direccion ||
                "—"
        },

        {
            key: "productos",
            label: "Productos",

            render: (item) => (

                <button
                    type="button"
                    onClick={() =>
                        seleccionarProveedor(
                            item
                        )
                    }
                >
                    Ver productos
                </button>

            )
        }

    ];


    return (

        <div className="page">

            <PageHeader
                title="Proveedores"
            />


            <section>

                <h2>
                    {
                        editandoId
                            ? "Editar proveedor"
                            : "Nuevo proveedor"
                    }
                </h2>


                <form
                    className="provider-form"
                    onSubmit={
                        guardarProveedor
                    }
                >

                    <div className="form-field">

                        <label>
                            Nombre
                        </label>

                        <input
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

                        <label>
                            Teléfono
                        </label>

                        <input
                            value={telefono}
                            onChange={(e) =>
                                setTelefono(
                                    e.target.value
                                )
                            }
                        />

                    </div>


                    <div className="form-field">

                        <label>
                            Dirección
                        </label>

                        <input
                            value={direccion}
                            onChange={(e) =>
                                setDireccion(
                                    e.target.value
                                )
                            }
                        />

                    </div>


                    <div className="form-field provider-notes">

                        <label>
                            Notas
                        </label>

                        <textarea
                            rows="2"
                            value={notas}
                            onChange={(e) =>
                                setNotas(
                                    e.target.value
                                )
                            }
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
                    />

                </form>

            </section>


            <CrudTable
                columns={
                    columnasProveedores
                }
                items={
                    proveedores
                }
                onEdit={
                    editarProveedor
                }
                onDelete={
                    eliminarProveedor
                }
                emptyMessage=
                    "No hay proveedores."
            />


            {
                proveedorSeleccionado && (

                    <section className="provider-products">

                        <h2>
                            Productos de{" "}
                            {
                                proveedorSeleccionado
                                    .nombre
                            }
                        </h2>


                        <form
                            className="provider-search"
                            onSubmit={
                                buscarProductos
                            }
                        >

                            <div className="form-field">

                                <label>
                                    Buscar producto
                                </label>

                                <input
                                    value={busqueda}
                                    onChange={(e) =>
                                        setBusqueda(
                                            e.target.value
                                        )
                                    }
                                    placeholder=
                                        "Nombre o código"
                                />

                            </div>


                            <button type="submit">
                                Buscar
                            </button>

                        </form>


                        <div className="provider-search-results">

                            {resultados.map(
                                (producto) => (

                                    <button
                                        key={
                                            producto.id
                                        }
                                        type="button"
                                        onClick={() =>
                                            elegirProducto(
                                                producto
                                            )
                                        }
                                    >
                                        {
                                            producto.nombre
                                        }
                                    </button>

                                )
                            )}

                        </div>


                        {
                            productoSeleccionado && (

                                <form
                                    className="provider-link-form"
                                    onSubmit={
                                        guardarVinculo
                                    }
                                >

                                    <strong>
                                        {
                                            productoSeleccionado
                                                .nombre
                                        }
                                    </strong>


                                    <div className="form-field">

                                        <label>
                                            Código proveedor
                                        </label>

                                        <input
                                            value={
                                                codigoProveedor
                                            }
                                            onChange={(e) =>
                                                setCodigoProveedor(
                                                    e.target.value
                                                )
                                            }
                                        />

                                    </div>


                                    <div className="form-field">

                                        <label>
                                            Último costo
                                        </label>

                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={
                                                ultimoCosto
                                            }
                                            onChange={(e) =>
                                                setUltimoCosto(
                                                    e.target.value
                                                )
                                            }
                                        />

                                    </div>


                                    <div className="form-field">

                                        <label>
                                            Notas
                                        </label>

                                        <input
                                            value={
                                                notasVinculo
                                            }
                                            onChange={(e) =>
                                                setNotasVinculo(
                                                    e.target.value
                                                )
                                            }
                                        />

                                    </div>


                                    <div className="form-actions">

                                        <button type="submit">

                                            {
                                                vinculoId
                                                    ? "Actualizar"
                                                    : "Vincular"
                                            }

                                        </button>


                                        <button
                                            type="button"
                                            onClick={
                                                limpiarVinculo
                                            }
                                        >
                                            Cancelar
                                        </button>

                                    </div>

                                </form>

                            )
                        }


                        <div className="provider-links">

                            {productosProveedor.length === 0
                                ? (

                                    <p>
                                        Este proveedor todavía
                                        no tiene productos.
                                    </p>

                                )
                                : (

                                    productosProveedor.map(
                                        (item) => (

                                            <div
                                                key={
                                                    item.id
                                                }
                                                className="provider-link"
                                            >

                                                <div>

                                                    <strong>
                                                        {
                                                            item.producto_nombre
                                                        }
                                                    </strong>

                                                    <small>
                                                        Código proveedor:{" "}
                                                        {
                                                            item.codigo_proveedor ||
                                                            "—"
                                                        }
                                                    </small>

                                                    <small>
                                                        Último costo:{" "}

                                                        {
                                                            item.ultimo_costo ??
                                                            "—"
                                                        }
                                                    </small>

                                                </div>


                                                <div className="table-actions">

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            editarVinculo(
                                                                item
                                                            )
                                                        }
                                                    >
                                                        Editar
                                                    </button>


                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            desvincularProducto(
                                                                item.id
                                                            )
                                                        }
                                                    >
                                                        Quitar
                                                    </button>

                                                </div>

                                            </div>

                                        )
                                    )

                                )
                            }

                        </div>

                    </section>

                )
            }

        </div>

    );

}


export default Proveedores;