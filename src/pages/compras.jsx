import {
    useEffect,
    useState
} from "react";

import PageHeader
    from "../components/pageHeader.jsx";

import CrudTable
    from "../components/crudTable.jsx";


const LIMITE_HISTORIAL = 25;


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


const columnasDetalle = [

    {
        key: "producto_nombre",
        label: "Producto"
    },

    {
        key: "cantidad",
        label: "Cantidad"
    },

    {
        key: "costo_unitario",
        label: "Costo",

        render: (item) =>
            moneda.format(
                item.costo_unitario
            )
    },

    {
        key: "subtotal",
        label: "Subtotal",

        render: (item) =>
            moneda.format(
                item.subtotal
            )
    }

];


function Compras() {

    const [
        proveedores,
        setProveedores
    ] = useState([]);


    const [
        proveedorId,
        setProveedorId
    ] = useState("");


    const [
        productosProveedor,
        setProductosProveedor
    ] = useState([]);


    const [
        pendientes,
        setPendientes
    ] = useState([]);


    const [
        productoId,
        setProductoId
    ] = useState("");


    const [
        cantidad,
        setCantidad
    ] = useState("1");


    const [
        costo,
        setCosto
    ] = useState("");


    const [
        items,
        setItems
    ] = useState([]);


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
        historial,
        setHistorial
    ] = useState([]);


    const [
        paginaHistorial,
        setPaginaHistorial
    ] = useState(1);


    const [
        totalPaginas,
        setTotalPaginas
    ] = useState(1);


    const [
        compraDetalle,
        setCompraDetalle
    ] = useState(null);


    const [
        guardando,
        setGuardando
    ] = useState(false);

    const [
        motivoReversion,
        setMotivoReversion
    ] = useState("");


    const [
        revirtiendo,
        setRevirtiendo
    ] = useState(false);


    const [
        avisoReversion,
        setAvisoReversion
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


    const cargarHistorial =
        async (
            pagina = 1
        ) => {

            const resultado =
                await window
                    .electronAPI
                    .compras
                    .listar({

                        proveedor_id:
                            null,

                        pagina,

                        limite:
                            LIMITE_HISTORIAL

                    });


            setHistorial(
                resultado.items
            );

            setPaginaHistorial(
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

                    const [
                        proveedoresData,
                        historialData
                    ] =
                        await Promise.all([

                            window
                                .electronAPI
                                .proveedores
                                .listar(),

                            window
                                .electronAPI
                                .compras
                                .listar({
                                    pagina: 1,
                                    limite:
                                        LIMITE_HISTORIAL
                                })

                        ]);


                    setProveedores(
                        proveedoresData
                    );


                    setHistorial(
                        historialData.items
                    );

                    setPaginaHistorial(
                        historialData.pagina
                    );

                    setTotalPaginas(
                        historialData.totalPaginas
                    );


                } catch (error) {

                    await mostrarError(
                        error
                    );

                }

            };


        iniciar();

    }, []);


    const cargarProveedor =
        async (id) => {

            const [
                productos,
                lista
            ] =
                await Promise.all([

                    window
                        .electronAPI
                        .proveedores
                        .productos(id),

                    window
                        .electronAPI
                        .compras
                        .pendientesProveedor(id)

                ]);


            setProductosProveedor(
                productos
            );

            setPendientes(
                lista
            );

        };


    const cambiarProveedor =
        async (valor) => {

            setProveedorId(
                valor
            );

            setProductoId("");

            setCantidad("1");

            setCosto("");

            setProductosProveedor([]);

            setPendientes([]);


            if (!valor) {
                return;
            }


            try {

                await cargarProveedor(
                    Number(valor)
                );


            } catch (error) {

                await mostrarError(
                    error
                );

            }

        };


    const cambiarProducto =
        (valor) => {

            setProductoId(
                valor
            );


            const producto =
                productosProveedor.find(
                    (item) =>
                        String(
                            item.producto_id
                        ) ===
                        String(valor)
                );


            setCosto(
                producto
                    ?.ultimo_costo ??
                ""
            );

        };


    const agregarAlBorrador =
        ({
            id,
            nombre,
            codigo,
            cantidadNueva,
            costoNuevo,
            listaItemId = null
        }) => {

            setItems(
                (actuales) => {

                    const existente =
                        actuales.find(
                            (item) =>
                                item.producto_id ===
                                id
                        );


                    if (existente) {

                        return actuales.map(
                            (item) =>
                                item.producto_id === id
                                    ? {
                                        ...item,

                                        cantidad:
                                            item.cantidad +
                                            cantidadNueva,

                                        lista_item_id:
                                            item.lista_item_id ||
                                            listaItemId
                                    }
                                    : item
                        );

                    }


                    return [
                        ...actuales,

                        {
                            producto_id:
                                id,

                            producto_nombre:
                                nombre,

                            producto_codigo:
                                codigo,

                            cantidad:
                                cantidadNueva,

                            costo_unitario:
                                costoNuevo,

                            lista_item_id:
                                listaItemId
                        }

                    ];

                }
            );

        };


    const agregarProducto =
        (e) => {

            e.preventDefault();


            const producto =
                productosProveedor.find(
                    (item) =>
                        String(
                            item.producto_id
                        ) ===
                        String(productoId)
                );


            const cantidadNumero =
                Number(cantidad);


            const costoNumero =
                Number(costo);


            if (
                !producto ||
                !Number.isInteger(
                    cantidadNumero
                ) ||
                cantidadNumero <= 0 ||
                !Number.isFinite(
                    costoNumero
                ) ||
                costoNumero < 0
            ) {

                return;

            }


            agregarAlBorrador({

                id:
                    producto.producto_id,

                nombre:
                    producto.producto_nombre,

                codigo:
                    producto.producto_codigo,

                cantidadNueva:
                    cantidadNumero,

                costoNuevo:
                    costoNumero

            });


            setProductoId("");

            setCantidad("1");

            setCosto("");

        };


    const cargarDesdeLista =
    () => {

        setItems(
            (actuales) => {

                let nuevos = [
                    ...actuales
                ];


                for (
                    const pendiente
                    of pendientes
                ) {

                    const indice =
                        nuevos.findIndex(
                            (item) =>
                                item.producto_id ===
                                pendiente.producto_id
                        );


                    if (indice >= 0) {

                        nuevos[indice] = {
                            ...nuevos[indice],

                            cantidad:
                                Math.max(
                                    Number(
                                        nuevos[indice]
                                            .cantidad
                                    ),
                                    pendiente.cantidad
                                ),

                            lista_item_id:
                                nuevos[indice]
                                    .lista_item_id ||
                                pendiente.lista_item_id
                        };


                    } else {

                        nuevos.push({

                            producto_id:
                                pendiente.producto_id,

                            producto_nombre:
                                pendiente.nombre,

                            producto_codigo:
                                pendiente.codigo,

                            cantidad:
                                pendiente.cantidad,

                            costo_unitario:
                                pendiente.ultimo_costo ??
                                0,

                            lista_item_id:
                                pendiente.lista_item_id

                        });

                    }

                }


                return nuevos;

            }
        );

    };


    const cambiarItem =
        (
            productoId,
            campo,
            valor
        ) => {

            setItems(
                (actuales) =>
                    actuales.map(
                        (item) =>
                            item.producto_id ===
                                productoId
                                ? {
                                    ...item,
                                    [campo]:
                                        valor
                                }
                                : item
                    )
            );

        };


    const quitarItem =
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


    const total =
        items.reduce(
            (
                acumulado,
                item
            ) => {

                return (
                    acumulado +
                    Number(
                        item.cantidad
                    ) *
                    Number(
                        item.costo_unitario
                    )
                );

            },
            0
        );


    const registrarCompra =
        async () => {

            if (
                !proveedorId ||
                items.length === 0 ||
                guardando
            ) {

                return;

            }


            const confirmar =
                await window
                    .electronAPI
                    .dialogos
                    .confirmar(
                        `¿Registrar compra por ${moneda.format(total)}?`
                    );


            if (!confirmar) {
                return;
            }


            setGuardando(true);


            try {

                const compra =
                    await window
                        .electronAPI
                        .compras
                        .crear({

                            proveedor_id:
                                Number(
                                    proveedorId
                                ),

                            fecha,

                            notas,

                            items:
                                items.map(
                                    (item) => ({

                                        producto_id:
                                            item.producto_id,

                                        lista_item_id:
                                            item.lista_item_id,

                                        cantidad:
                                            Number(
                                                item.cantidad
                                            ),

                                        costo_unitario:
                                            Number(
                                                item.costo_unitario
                                            )

                                    })
                                )

                        });


                setCompraDetalle(
                    compra
                );


                setItems([]);

                setNotas("");

                setFecha(
                    fechaLocalActual()
                );


                await Promise.all([

                    cargarProveedor(
                        Number(
                            proveedorId
                        )
                    ),

                    cargarHistorial(1)

                ]);


            } catch (error) {

                await mostrarError(
                    error
                );


            } finally {

                setGuardando(false);

            }

        };


    const abrirCompra =
        async (id) => {

            try {

                const compra =
                    await window
                        .electronAPI
                        .compras
                        .obtener(id);


                setCompraDetalle(
                    compra
                );


                setMotivoReversion("");

                setAvisoReversion("");


            } catch (error) {

                await mostrarError(
                    error
                );

            }

        };

    const revertirCompraActual =
        async () => {

            if (
                !compraDetalle ||
                compraDetalle.estado !== "ACTIVA" ||
                revirtiendo
            ) {
                return;
            }


            const motivo =
                motivoReversion.trim();


            if (motivo.length < 3) {

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
                        `¿Revertir la compra #${compraDetalle.id}? El stock agregado será retirado.`
                    );


            if (!confirmar) {
                return;
            }


            setRevirtiendo(true);


            try {

                const resultado =
                    await window
                        .electronAPI
                        .compras
                        .revertir({

                            id:
                                compraDetalle.id,

                            motivo

                        });


                setCompraDetalle(
                    resultado.compra
                );


                setMotivoReversion("");


                if (
                    resultado
                        .listas_no_restauradas > 0
                ) {

                    setAvisoReversion(
                        `${resultado.listas_no_restauradas} ítem(s) de la lista de compras no pudieron restaurarse automáticamente.`
                    );

                } else {

                    setAvisoReversion(
                        "La compra fue revertida correctamente."
                    );

                }


                await cargarHistorial(1);


                if (proveedorId) {

                    await cargarProveedor(
                        Number(proveedorId)
                    );

                }


            } catch (error) {

                await mostrarError(error);


            } finally {

                setRevirtiendo(false);

            }

        };

    return (

        <div className="page">

            <PageHeader
                title="Compras"
            />


            <section>

                <h2>
                    Nueva compra
                </h2>


                <div className="purchase-header">

                    <div className="form-field">

                        <label>
                            Proveedor
                        </label>

                        <select
                            value={
                                proveedorId
                            }
                            onChange={(e) =>
                                cambiarProveedor(
                                    e.target.value
                                )
                            }
                            disabled={
                                items.length > 0
                            }
                        >

                            <option value="">
                                Seleccionar proveedor
                            </option>

                            {proveedores.map(
                                (proveedor) => (

                                    <option
                                        key={
                                            proveedor.id
                                        }
                                        value={
                                            proveedor.id
                                        }
                                    >
                                        {
                                            proveedor.nombre
                                        }
                                    </option>

                                )
                            )}

                        </select>

                    </div>


                    <div className="form-field">

                        <label>
                            Fecha
                        </label>

                        <input
                            type="datetime-local"
                            value={fecha}
                            onChange={(e) =>
                                setFecha(
                                    e.target.value
                                )
                            }
                        />

                    </div>

                </div>


                {proveedorId && (

                    <>

                        <form
                            className="purchase-product-form"
                            onSubmit={
                                agregarProducto
                            }
                        >

                            <div className="form-field">

                                <label>
                                    Producto
                                </label>

                                <select
                                    value={
                                        productoId
                                    }
                                    onChange={(e) =>
                                        cambiarProducto(
                                            e.target.value
                                        )
                                    }
                                >

                                    <option value="">
                                        Seleccionar producto
                                    </option>

                                    {
                                        productosProveedor
                                            .map(
                                                (producto) => (

                                                    <option
                                                        key={
                                                            producto.id
                                                        }
                                                        value={
                                                            producto.producto_id
                                                        }
                                                    >
                                                        {
                                                            producto.producto_nombre
                                                        }
                                                    </option>

                                                )
                                            )
                                    }

                                </select>

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
                                        cantidad
                                    }
                                    onChange={(e) =>
                                        setCantidad(
                                            e.target.value
                                        )
                                    }
                                />

                            </div>


                            <div className="form-field">

                                <label>
                                    Costo unitario
                                </label>

                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={
                                        costo
                                    }
                                    onChange={(e) =>
                                        setCosto(
                                            e.target.value
                                        )
                                    }
                                />

                            </div>


                            <button type="submit">
                                Agregar
                            </button>

                        </form>


                        {pendientes.length > 0 && (

                            <div className="purchase-list-import">

                                <span>
                                    {
                                        pendientes.length
                                    } faltante
                                    {
                                        pendientes.length !== 1
                                            ? "s"
                                            : ""
                                    }
                                    {" de este proveedor"}
                                </span>


                                <button
                                    type="button"
                                    onClick={
                                        cargarDesdeLista
                                    }
                                >
                                    Cargar desde lista
                                </button>

                            </div>

                        )}

                    </>

                )}

            </section>


            <section>

                <h2>
                    Detalle
                </h2>


                <div className="purchase-table-wrapper">

                    <table className="purchase-table">

                        <thead>

                            <tr>

                                <th>
                                    Producto
                                </th>

                                <th>
                                    Cantidad
                                </th>

                                <th>
                                    Costo
                                </th>

                                <th>
                                    Subtotal
                                </th>

                                <th>
                                </th>

                            </tr>

                        </thead>


                        <tbody>

                            {items.length === 0 ? (

                                <tr>

                                    <td
                                        colSpan="5"
                                        className="crud-table-empty"
                                    >
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
                                                    className="purchase-number"
                                                    type="number"
                                                    min="1"
                                                    step="1"
                                                    value={
                                                        item.cantidad
                                                    }
                                                    onChange={(e) =>
                                                        cambiarItem(
                                                            item.producto_id,
                                                            "cantidad",
                                                            e.target.value
                                                        )
                                                    }
                                                />

                                            </td>


                                            <td>

                                                <input
                                                    className="purchase-cost"
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={
                                                        item.costo_unitario
                                                    }
                                                    onChange={(e) =>
                                                        cambiarItem(
                                                            item.producto_id,
                                                            "costo_unitario",
                                                            e.target.value
                                                        )
                                                    }
                                                />

                                            </td>


                                            <td>
                                                {
                                                    moneda.format(
                                                        Number(
                                                            item.cantidad
                                                        ) *
                                                        Number(
                                                            item.costo_unitario
                                                        )
                                                    )
                                                }
                                            </td>


                                            <td>

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        quitarItem(
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


                <div className="purchase-footer">

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


                    <div className="purchase-total">

                        <span>
                            Total
                        </span>

                        <strong>
                            {
                                moneda.format(
                                    total
                                )
                            }
                        </strong>

                    </div>

                </div>


                <button
                    type="button"
                    disabled={
                        items.length === 0 ||
                        guardando
                    }
                    onClick={
                        registrarCompra
                    }
                >
                    {
                        guardando
                            ? "Registrando..."
                            : "Registrar compra"
                    }
                </button>

            </section>


            <section className="purchase-history">

                <h2>
                    Historial de compras
                </h2>


                {historial.map(
                    (compra) => (

                        <button
                            key={
                                compra.id
                            }
                            type="button"
                            onClick={() =>
                                abrirCompra(
                                    compra.id
                                )
                            }
                        >

                            <span>
                                #
                                {compra.id}
                                {" · "}
                                {
                                    compra.proveedor_nombre ||
                                    "Sin proveedor"
                                }
                            </span>


                            <span>
                                {
                                    new Date(
                                        compra.fecha
                                    )
                                        .toLocaleString(
                                            "es-AR"
                                        )
                                }
                            </span>



                            <strong>
                                {
                                    moneda.format(
                                        compra.total
                                    )
                                }
                            </strong>

                            <span>
                                #{compra.id}
                                {" · "}
                                {compra.proveedor_nombre || "Sin proveedor"}
                                {" · "}
                                {
                                    compra.estado === "REVERTIDA"
                                        ? "REVERTIDA"
                                        : "ACTIVA"
                                }
                            </span>
                        </button>


                    )
                )}


                <div className="pagination">

                    <button
                        type="button"
                        disabled={
                            paginaHistorial <= 1
                        }
                        onClick={() =>
                            cargarHistorial(
                                paginaHistorial - 1
                            )
                        }
                    >
                        ← Anterior
                    </button>


                    <span>
                        Página{" "}
                        {paginaHistorial}
                        {" de "}
                        {totalPaginas}
                    </span>


                    <button
                        type="button"
                        disabled={
                            paginaHistorial >=
                            totalPaginas
                        }
                        onClick={() =>
                            cargarHistorial(
                                paginaHistorial + 1
                            )
                        }
                    >
                        Siguiente →
                    </button>

                </div>



            </section>


            {compraDetalle && (

                <section className="purchase-detail">

                    <h2>
                        Compra #{compraDetalle.id}
                    </h2>


                    <p>
                        Proveedor:{" "}
                        <strong>
                            {compraDetalle.proveedor_nombre || "Sin proveedor"}
                        </strong>
                    </p>


                    <p>
                        Total:{" "}
                        <strong>
                            {moneda.format(
                                compraDetalle.total
                            )}
                        </strong>
                    </p>


                    <p>
                        Estado:{" "}
                        <strong>
                            {
                                compraDetalle.estado === "REVERTIDA"
                                    ? "Revertida"
                                    : "Activa"
                            }
                        </strong>
                    </p>


                    {compraDetalle.estado === "REVERTIDA" && (

                        <div className="purchase-reverted-info">

                            <p>
                                Revertida el{" "}

                                <strong>
                                    {
                                        compraDetalle.fecha_reversion
                                            ? new Date(
                                                compraDetalle.fecha_reversion
                                            )
                                                .toLocaleString(
                                                    "es-AR"
                                                )
                                            : "—"
                                    }
                                </strong>
                            </p>


                            <p>
                                Motivo:{" "}
                                {
                                    compraDetalle.motivo_reversion ||
                                    "—"
                                }
                            </p>

                        </div>

                    )}


                    <CrudTable
                        columns={columnasDetalle}
                        items={
                            compraDetalle.items || []
                        }
                        emptyMessage="La compra no tiene productos."
                    />


                    {compraDetalle.estado === "ACTIVA" && (

                        <div className="purchase-reversal">

                            <h3>
                                Revertir compra
                            </h3>


                            <div className="form-field">

                                <label>
                                    Motivo
                                </label>

                                <textarea
                                    rows="3"
                                    value={motivoReversion}
                                    onChange={(e) =>
                                        setMotivoReversion(
                                            e.target.value
                                        )
                                    }
                                    placeholder="Ej: compra cargada dos veces"
                                />

                            </div>


                            <button
                                type="button"
                                disabled={revirtiendo}
                                onClick={
                                    revertirCompraActual
                                }
                            >
                                {
                                    revirtiendo
                                        ? "Revirtiendo..."
                                        : "Revertir compra"
                                }
                            </button>

                        </div>

                    )}


                    {avisoReversion && (

                        <p className="purchase-reversal-message">
                            {avisoReversion}
                        </p>

                    )}

                </section>

            )}

        </div>


    );

}


export default Compras;