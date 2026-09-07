import {
    useEffect,
    useState
} from "react";

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


function Caja() {

    const [
        caja,
        setCaja
    ] = useState(null);

    const [
        movimientos,
        setMovimientos
    ] = useState([]);

    const [
        historial,
        setHistorial
    ] = useState([]);


    const [
        saldoInicial,
        setSaldoInicial
    ] = useState("0");

    const [
        notasApertura,
        setNotasApertura
    ] = useState("");


    const [
        tipoMovimiento,
        setTipoMovimiento
    ] = useState("INGRESO");

    const [
        metodoPago,
        setMetodoPago
    ] = useState("EFECTIVO");

    const [
        concepto,
        setConcepto
    ] = useState("");

    const [
        monto,
        setMonto
    ] = useState("");

    const [
        notasMovimiento,
        setNotasMovimiento
    ] = useState("");

    const [
        movimientoReversion,
        setMovimientoReversion
    ] = useState(null);


    const [
        motivoReversionManual,
        setMotivoReversionManual
    ] = useState("");


    const [
        revirtiendoManual,
        setRevirtiendoManual
    ] = useState(false);

    const [
        efectivoReal,
        setEfectivoReal
    ] = useState("");

    const [
        notasCierre,
        setNotasCierre
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


    const cargarCaja =
        async () => {

            const actual =
                await window
                    .electronAPI
                    .caja
                    .actual();


            setCaja(actual);


            if (actual) {

                const resultado =
                    await window
                        .electronAPI
                        .caja
                        .movimientos({

                            caja_id:
                                actual.id,

                            pagina: 1,

                            limite: 100

                        });


                setMovimientos(
                    resultado.items
                );


            } else {

                setMovimientos([]);

            }

        };


    const cargarHistorial =
        async () => {

            const resultado =
                await window
                    .electronAPI
                    .caja
                    .historial({
                        pagina: 1
                    });


            setHistorial(
                resultado.items
            );

        };


    useEffect(() => {

        const iniciar =
            async () => {

                try {

                    await Promise.all([
                        cargarCaja(),
                        cargarHistorial()
                    ]);


                } catch (error) {

                    await mostrarError(
                        error
                    );

                }

            };


        iniciar();

    }, []);


    const refrescar =
        async () => {

            await Promise.all([
                cargarCaja(),
                cargarHistorial()
            ]);

        };


    const abrir =
        async () => {

            try {

                await window
                    .electronAPI
                    .caja
                    .abrir({

                        saldo_inicial:
                            Number(
                                saldoInicial
                            ),

                        notas:
                            notasApertura

                    });


                setSaldoInicial("0");
                setNotasApertura("");


                await refrescar();


            } catch (error) {

                await mostrarError(
                    error
                );

            }

        };


    const agregarMovimiento =
        async () => {

            try {

                await window
                    .electronAPI
                    .caja
                    .movimientoManual({

                        tipo:
                            tipoMovimiento,

                        metodo_pago:
                            metodoPago,

                        concepto,

                        monto:
                            Number(monto),

                        notas:
                            notasMovimiento

                    });


                setConcepto("");
                setMonto("");
                setNotasMovimiento("");


                await cargarCaja();


            } catch (error) {

                await mostrarError(
                    error
                );

            }

        };


    const iniciarReversionManual =
        (movimiento) => {

            setMovimientoReversion(
                movimiento
            );

            setMotivoReversionManual(
                ""
            );

        };


    const cancelarReversionManual =
        () => {

            if (revirtiendoManual) {
                return;
            }


            setMovimientoReversion(
                null
            );

            setMotivoReversionManual(
                ""
            );

        };


    const confirmarReversionManual =
        async () => {

            if (
                !movimientoReversion ||
                revirtiendoManual
            ) {

                return;

            }


            const motivo =
                motivoReversionManual
                    .trim();


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
                        `¿Revertir el movimiento #${movimientoReversion.id} por ${moneda.format(
                            Math.abs(
                                movimientoReversion.monto
                            )
                        )}?`
                    );


            if (!confirmar) {
                return;
            }


            setRevirtiendoManual(
                true
            );


            try {

                await window
                    .electronAPI
                    .caja
                    .revertirManual({

                        id:
                            movimientoReversion.id,

                        motivo

                    });


                setMovimientoReversion(
                    null
                );

                setMotivoReversionManual(
                    ""
                );


                await cargarCaja();


            } catch (error) {

                await mostrarError(
                    error
                );


            } finally {

                setRevirtiendoManual(
                    false
                );

            }

        };


    const cerrar =
        async () => {

            if (!caja) {
                return;
            }


            const confirmar =
                await window
                    .electronAPI
                    .dialogos
                    .confirmar(
                        `¿Cerrar caja? Efectivo esperado: ${moneda.format(
                            caja.resumen
                                .efectivo_esperado_actual
                        )}`
                    );


            if (!confirmar) {
                return;
            }


            try {

                await window
                    .electronAPI
                    .caja
                    .cerrar({

                        efectivo_real:
                            Number(
                                efectivoReal
                            ),

                        notas:
                            notasCierre

                    });


                setEfectivoReal("");
                setNotasCierre("");


                await refrescar();


            } catch (error) {

                await mostrarError(
                    error
                );

            }

        };


    const diferenciaActual =
        caja &&
            efectivoReal !== ""
            ? Number(
                efectivoReal
            ) -
            caja.resumen
                .efectivo_esperado_actual
            : null;


    return (

        <div className="page">

            <PageHeader
                title="Caja"
            />


            {!caja ? (

                <section>

                    <h2>
                        Abrir caja
                    </h2>


                    <div className="form-field">

                        <label>
                            Efectivo inicial
                        </label>

                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={
                                saldoInicial
                            }
                            onChange={(event) =>
                                setSaldoInicial(
                                    event.target.value
                                )
                            }
                        />

                    </div>


                    <div className="form-field">

                        <label>
                            Notas
                        </label>

                        <textarea
                            value={
                                notasApertura
                            }
                            onChange={(event) =>
                                setNotasApertura(
                                    event.target.value
                                )
                            }
                        />

                    </div>


                    <button
                        type="button"
                        onClick={abrir}
                    >
                        Abrir caja
                    </button>

                </section>

            ) : (

                <>

                    <section>

                        <h2>
                            Caja abierta
                        </h2>


                        <p>
                            Desde:{" "}
                            <strong>
                                {
                                    new Date(
                                        caja.fecha_apertura
                                    )
                                        .toLocaleString(
                                            "es-AR"
                                        )
                                }
                            </strong>
                        </p>


                        <div className="cash-summary">

                            <div>
                                <span>
                                    Inicial
                                </span>

                                <strong>
                                    {
                                        moneda.format(
                                            caja.saldo_inicial
                                        )
                                    }
                                </strong>
                            </div>


                            <div>
                                <span>
                                    Ventas netas
                                </span>

                                <strong>
                                    {
                                        moneda.format(
                                            caja.resumen
                                                .ventas_netas
                                        )
                                    }
                                </strong>
                            </div>


                            <div>
                                <span>
                                    Movimiento neto
                                </span>

                                <strong>
                                    {
                                        moneda.format(
                                            caja.resumen
                                                .movimiento_neto
                                        )
                                    }
                                </strong>
                            </div>


                            <div>
                                <span>
                                    Efectivo esperado
                                </span>

                                <strong>
                                    {
                                        moneda.format(
                                            caja.resumen
                                                .efectivo_esperado_actual
                                        )
                                    }
                                </strong>
                            </div>

                        </div>


                        <h3>
                            Por método
                        </h3>


                        <div className="cash-methods">

                            {caja.por_metodo.map(
                                (item) => (

                                    <div
                                        key={
                                            item.metodo_pago
                                        }
                                    >

                                        <span>
                                            {
                                                item.metodo_pago
                                            }
                                        </span>

                                        <strong>
                                            {
                                                moneda.format(
                                                    item.total
                                                )
                                            }
                                        </strong>

                                    </div>

                                )
                            )}

                        </div>

                    </section>


                    <section>

                        <h2>
                            Movimiento manual
                        </h2>


                        <div className="cash-form-grid">

                            <div className="form-field">

                                <label>
                                    Tipo
                                </label>

                                <select
                                    value={
                                        tipoMovimiento
                                    }
                                    onChange={(event) =>
                                        setTipoMovimiento(
                                            event.target.value
                                        )
                                    }
                                >
                                    <option value="INGRESO">
                                        Ingreso
                                    </option>

                                    <option value="EGRESO">
                                        Egreso
                                    </option>
                                </select>

                            </div>


                            <div className="form-field">

                                <label>
                                    Método
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
                                    Concepto
                                </label>

                                <input
                                    value={
                                        concepto
                                    }
                                    onChange={(event) =>
                                        setConcepto(
                                            event.target.value
                                        )
                                    }
                                />

                            </div>

                        </div>


                        <button
                            type="button"
                            onClick={
                                agregarMovimiento
                            }
                        >
                            Registrar movimiento
                        </button>

                    </section>


                    <section>

                        <h2>
                            Movimientos
                        </h2>


                        <div className="cash-table-wrapper">

                            <table className="cash-table">

                                <thead>

                                    <tr>
                                        <th>Fecha</th>
                                        <th>Tipo</th>
                                        <th>Concepto</th>
                                        <th>Método</th>
                                        <th>Monto</th>
                                        <th></th>
                                    </tr>

                                </thead>


                                <tbody>

                                    {movimientos.map(
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
                                                        item.tipo
                                                    }
                                                </td>

                                                <td>
                                                    {
                                                        item.concepto
                                                    }
                                                </td>

                                                <td>
                                                    {
                                                        item.metodo_pago ||
                                                        "—"
                                                    }
                                                </td>

                                                <td>
                                                    {
                                                        moneda.format(
                                                            item.monto
                                                        )
                                                    }
                                                </td>

                                                <td>

                                                    {
                                                        (
                                                            item.tipo ===
                                                            "INGRESO_MANUAL" ||
                                                            item.tipo ===
                                                            "EGRESO_MANUAL"
                                                        ) &&
                                                        !item.revertido && (

                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    iniciarReversionManual(
                                                                        item
                                                                    )
                                                                }
                                                            >
                                                                Revertir
                                                            </button>

                                                        )
                                                    }

                                                </td>

                                            </tr>

                                        )
                                    )}

                                </tbody>

                            </table>

                        </div>

                        {movimientoReversion && (

                            <div className="cash-reversal">

                                <h3>
                                    Revertir movimiento manual
                                </h3>


                                <p>
                                    Movimiento:{" "}

                                    <strong>
                                        #{movimientoReversion.id}
                                    </strong>
                                </p>


                                <p>
                                    {
                                        movimientoReversion
                                            .concepto
                                    }

                                    {" · "}

                                    <strong>
                                        {
                                            moneda.format(
                                                movimientoReversion
                                                    .monto
                                            )
                                        }
                                    </strong>
                                </p>


                                <div className="form-field">

                                    <label>
                                        Motivo de la reversión
                                    </label>

                                    <textarea
                                        rows="3"
                                        value={
                                            motivoReversionManual
                                        }
                                        onChange={(event) =>
                                            setMotivoReversionManual(
                                                event.target.value
                                            )
                                        }
                                        placeholder="Ej: movimiento cargado por error"
                                        disabled={
                                            revirtiendoManual
                                        }
                                    />

                                </div>


                                <div className="cash-reversal-actions">

                                    <button
                                        type="button"
                                        disabled={
                                            revirtiendoManual
                                        }
                                        onClick={
                                            confirmarReversionManual
                                        }
                                    >
                                        {
                                            revirtiendoManual
                                                ? "Revirtiendo..."
                                                : "Confirmar reversión"
                                        }
                                    </button>


                                    <button
                                        type="button"
                                        disabled={
                                            revirtiendoManual
                                        }
                                        onClick={
                                            cancelarReversionManual
                                        }
                                    >
                                        Cancelar
                                    </button>

                                </div>

                            </div>

                        )}

                    </section>


                    <section>

                        <h2>
                            Cerrar caja
                        </h2>


                        <p>
                            Efectivo esperado:{" "}

                            <strong>
                                {
                                    moneda.format(
                                        caja.resumen
                                            .efectivo_esperado_actual
                                    )
                                }
                            </strong>
                        </p>


                        <div className="form-field">

                            <label>
                                Efectivo contado
                            </label>

                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={
                                    efectivoReal
                                }
                                onChange={(event) =>
                                    setEfectivoReal(
                                        event.target.value
                                    )
                                }
                            />

                        </div>


                        {diferenciaActual !==
                            null && (

                                <p>
                                    Diferencia:{" "}

                                    <strong>
                                        {
                                            moneda.format(
                                                diferenciaActual
                                            )
                                        }
                                    </strong>
                                </p>

                            )}


                        <button
                            type="button"
                            onClick={cerrar}
                        >
                            Cerrar caja
                        </button>

                    </section>

                </>

            )}


            <section>

                <h2>
                    Historial de cajas
                </h2>


                {historial.map(
                    (item) => (

                        <div
                            key={item.id}
                            className="cash-history-item"
                        >

                            <span>
                                Caja #{item.id}
                            </span>

                            <span>
                                {
                                    new Date(
                                        item.fecha_apertura
                                    )
                                        .toLocaleString(
                                            "es-AR"
                                        )
                                }
                            </span>

                            <strong>
                                {
                                    item.estado
                                }
                            </strong>


                            {item.estado ===
                                "CERRADA" && (

                                    <span>
                                        Diferencia:{" "}
                                        {
                                            moneda.format(
                                                item.diferencia
                                            )
                                        }
                                    </span>

                                )}

                        </div>

                    )
                )}

            </section>

        </div>

    );

}


export default Caja;