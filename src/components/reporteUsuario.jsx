
import {
    useEffect,
    useMemo,
    useState
} from "react";



const moneda =
    new Intl.NumberFormat(
        "es-AR",
        {
            style: "currency",
            currency: "ARS"
        }
    );
    const numero =
    new Intl.NumberFormat(
        "es-AR"
    );



const DIAS = [
    "Lun",
    "Mar",
    "Mié",
    "Jue",
    "Vie",
    "Sáb",
    "Dom"
];


function ReporteUsuario({
    desde,
    hasta
}) {

    const [usuarios, setUsuarios] =
        useState([]);

    const [usuarioId, setUsuarioId] =
        useState("");

    const [datos, setDatos] =
        useState(null);

    const [cargando, setCargando] =
        useState(false);

    const [mesCalendario, setMesCalendario] =
        useState(hasta.slice(0, 7));
    
    const [sueldo, setSueldo] = useState("");


    // Cargar usuarios

    useEffect(() => {

        let vigente = true;

        window.electronAPI.reportes
            .usuarios()

            .then(resultado => {

                if (vigente) {
                    setUsuarios(resultado || []);
                }

            })

            .catch(error => {

                console.error(error);

                if (vigente) {
                    window.electronAPI.dialogos.error(
                        error?.message || String(error)
                    );
                }

            });

        return () => {
            vigente = false;
        };

    }, []);


    // Actualizar calendario al cambiar el período

    useEffect(() => {

        setMesCalendario(
            hasta.slice(0, 7)
        );

    }, [hasta]);


    // Consultar estadísticas del usuario

    useEffect(() => {

        let vigente = true;

        if (!usuarioId) {

            setDatos(null);
            setCargando(false);

            return () => {
                vigente = false;
            };

        }

        setDatos(null);
        setCargando(true);

        window.electronAPI.reportes
            .porUsuario({

                usuario_id: Number(usuarioId),

                desde,
                hasta

            })

            .then(resultado => {

                if (vigente) {
                    setDatos(resultado);
                }

            })

            .catch(async error => {

                console.error(error);

                if (vigente) {

                    await window.electronAPI.dialogos.error(
                        error?.message || String(error)
                    );

                }

            })

            .finally(() => {

                if (vigente) {
                    setCargando(false);
                }

            });

        return () => {
            vigente = false;
        };

    }, [usuarioId, desde, hasta]);


    // Actividad por fecha

    const actividadPorDia = useMemo(
        () => new Map(
            (datos?.diasActividad || []).map(
                item => [item.dia, item]
            )
        ),
        [datos]
    );


    const ventasPorDia = useMemo(
        () => new Map(
            (datos?.dias || []).map(
                item => [item.dia, item]
            )
        ),
        [datos]
    );


    // Construir calendario

    const celdasCalendario = useMemo(() => {

        const [
            anio,
            mes
        ] = mesCalendario
            .split("-")
            .map(Number);

        const primero =
            new Date(anio, mes - 1, 1);

        const desplazamiento =
            (primero.getDay() + 6) % 7;

        const cantidadDias =
            new Date(anio, mes, 0).getDate();

        return [

            ...Array(desplazamiento).fill(null),

            ...Array.from(
                { length: cantidadDias },
                (_, i) => i + 1
            )

        ];

    }, [mesCalendario]);


    const cambiarMes = (delta) => {

        const [
            anio,
            mes
        ] = mesCalendario
            .split("-")
            .map(Number);

        const fecha =
            new Date(
                anio,
                mes - 1 + delta,
                1
            );

        setMesCalendario(

            `${fecha.getFullYear()}-${
                String(
                    fecha.getMonth() + 1
                ).padStart(2, "0")
            }`

        );

    };


    const tituloMes =
        new Intl.DateTimeFormat(
            "es-AR",
            {
                month: "long",
                year: "numeric"
            }
        ).format(
            new Date(
                `${mesCalendario}-01T12:00:00`
            )
        );


    const resumen = datos?.resumen;


    return (

        <details className="report-panel report-user-panel">

            <summary>

                <span>
                    <strong>
                        Rendimiento por usuario
                    </strong>

                    <small>
                        Facturación, margen y actividad
                    </small>
                </span>

            </summary>


            <div className="report-user-content">

                <div className="form-field report-user-select">

                    <label htmlFor="reporte-usuario">
                        Seleccionar usuario
                    </label>

                    <select
                        id="reporte-usuario"
                        value={usuarioId}
                        onChange={event =>
                            setUsuarioId(
                                event.target.value
                            )
                        }
                    >

                        <option value="">
                            Seleccionar usuario...
                        </option>

                        {usuarios.map(usuario => (

                            <option
                                key={usuario.id}
                                value={usuario.id}
                            >

                                {usuario.nombre}

                                {!usuario.activo
                                    ? " (inactivo)"
                                    : ""
                                }

                            </option>

                        ))}

                    </select>

                </div>


                {cargando && (
                    <p>Calculando estadísticas...</p>
                )}


                {!usuarioId && (

                    <p>
                        Seleccioná un usuario para consultar
                        sus estadísticas.
                    </p>

                )}


                {usuarioId && datos && (

                    <>

                        {/* RESUMEN */}

                        <div className="reports-summary">

                            <article className="report-stat">

                                <span>Facturación</span>

                                <strong>
                                    {moneda.format(
                                        resumen.facturacion
                                    )}
                                </strong>

                                <small>
                                    {resumen.total_ventas} ventas
                                </small>

                            </article>

                             <article className="report-stat">

                                <span>Costo de Ventas</span>

                                 <strong>
                                {moneda.format(resumen.costo_vendido || 0)}
                            </strong>
                                <small>
                                    {resumen.total_ventas} ventas
                                </small>

                            </article>


                      

                            <article className="report-stat">

                                <span>Margen</span>

                                <strong>
                                    $ {Number(
                                        resumen.margen_bruto
                                    ).toFixed(2)}
                                </strong>

                            </article>

                            <article className="report-stat">

                                <span>Sueldo correspondido</span>
                                <input
                                type="number"
                                placeholder="Division de ganancias"
                                value={sueldo}
                                onChange={(e) => setSueldo(e.target.value)}
                                />
                                <strong>
                                    {moneda.format(resumen.margen_bruto / (sueldo)) || 0}
                                </strong>

                            </article>


                            <article className="report-stat">

                                <span>Días con actividad</span>

                                <strong>
                                    {resumen.dias_con_actividad}
                                </strong>

                                <small>
                                    Según registros de auditoría
                                </small>

                            </article>

                        </div>


                        {/* CALENDARIO */}

                        <section className="report-panel">

                            <div className="report-calendar-header">

                                <h3>
                                    Días con actividad registrada
                                </h3>

                                <div>

                                    <button
                                        type="button"
                                        onClick={() => cambiarMes(-1)}
                                    >
                                        ‹
                                    </button>

                                    <strong>
                                        {tituloMes}
                                    </strong>

                                    <button
                                        type="button"
                                        onClick={() => cambiarMes(1)}
                                    >
                                        ›
                                    </button>

                                </div>

                            </div>


                            <div className="report-calendar-grid">

                                {DIAS.map(dia => (

                                    <span
                                        key={dia}
                                        className="report-calendar-weekday"
                                    >
                                        {dia}
                                    </span>

                                ))}


                                {celdasCalendario.map(
                                    (dia, index) => {

                                        if (dia === null) {

                                            return (
                                                <span
                                                    key={`vacio-${index}`}
                                                    className="report-calendar-empty"
                                                />
                                            );

                                        }

                                        const fecha =
                                            `${mesCalendario}-${String(dia).padStart(2, "0")}`;

                                        const actividad =
                                            actividadPorDia.get(fecha);

                                        const ventasDia =
                                            ventasPorDia.get(fecha);

                                        return (

                                            <div
                                                key={fecha}
                                                className={
                                                    `report-calendar-day ${
                                                        actividad
                                                            ? "is-worked"
                                                            : ""
                                                    }`
                                                }
                                                title={
                                                    actividad
                                                        ? `${actividad.acciones} acciones registradas`
                                                        : "Sin actividad registrada"
                                                }
                                            >

                                                <span>{dia}</span>

                                                {actividad && (

                                                    <small>
                                                        {ventasDia?.ventas
                                                            ? `${ventasDia.ventas} v.`
                                                            : "•"
                                                        }
                                                    </small>

                                                )}

                                            </div>

                                        );

                                    }
                                )}

                            </div>


                            <p className="report-user-note">

                                Los días marcados indican actividad
                                registrada en el sistema. No representan
                                un control horario de entrada y salida.

                            </p>

                        </section>


                        {/* TABLA DIARIA */}

                        <section className="report-panel">

                            <h3>
                                Detalle diario de ventas
                            </h3>

                            {datos.dias.length === 0 ? (

                                <p>
                                    Este usuario no registró ventas
                                    en el período seleccionado.
                                </p>

                            ) : (

                                <div className="report-table-wrapper">

                                    <table className="report-table">

                                        <thead>

                                            <tr>
                                                <th>Fecha</th>
                                                <th>Ventas</th>
                                                <th>Facturación</th>
                                                <th>Margen bruto</th>
                                            </tr>

                                        </thead>

                                        <tbody>

                                            {datos.dias.map(item => (

                                                <tr key={item.dia}>

                                                    <td>{item.dia}</td>

                                                    <td>{item.ventas}</td>

                                                    <td>
                                                        {moneda.format(
                                                            item.facturacion
                                                        )}
                                                    </td>

                                                    <td>
                                                        {moneda.format(
                                                            item.margen_bruto
                                                        )}
                                                    </td>

                                                </tr>

                                            ))}

                                        </tbody>

                                    </table>

                                </div>

                            )}

                        </section>

                    </>

                )}

            </div>

        </details>

    );

}

export default ReporteUsuario;
