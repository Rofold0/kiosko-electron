import {
    useEffect,
    useState
} from "react";

import PageHeader
    from "../components/pageHeader.jsx";


function Configuracion() {

    const [
        estado,
        setEstado
    ] = useState(null);


    const [
        procesando,
        setProcesando
    ] = useState(false);


    const cargar =
        async () => {

            const resultado =
                await window
                    .electronAPI
                    .backup
                    .estado();


            setEstado(
                resultado
            );

        };


    useEffect(
        () => {

            cargar();

        },
        []
    );


    const crearBackup =
        async () => {

            setProcesando(
                true
            );


            try {

                const resultado =
                    await window
                        .electronAPI
                        .backup
                        .crear();


                if (
                    !resultado?.cancelado
                ) {

                    await cargar();

                }


            } catch (error) {

                await window
                    .electronAPI
                    .dialogos
                    .error(
                        error?.message ||
                        "No se pudo crear la copia de seguridad."
                    );


            } finally {

                setProcesando(
                    false
                );

            }

        };


    const restaurar =
        async () => {

            setProcesando(
                true
            );


            try {

                await window
                    .electronAPI
                    .backup
                    .restaurar();


            } catch (error) {

                await window
                    .electronAPI
                    .dialogos
                    .error(
                        error?.message ||
                        "No se pudo restaurar la copia de seguridad."
                    );


                setProcesando(
                    false
                );

            }

        };


    return (

        <div className="page">

            <PageHeader
                title="Configuración"
            />


            <section>

                <h2>
                    Copias de seguridad
                </h2>


                <p>
                    El sistema crea una copia automática por día y conserva las últimas 7.
                </p>


                {estado && (

                    <>

                        <p>
                            Copias automáticas:{" "}
                            <strong>
                                {
                                    estado
                                        .cantidadAutomaticos
                                }
                            </strong>
                        </p>


                        <p>
                            Última copia:{" "}

                            <strong>

                                {
                                    estado
                                        .ultimoAutomatico

                                        ? new Date(
                                            estado
                                                .ultimoAutomatico
                                                .modificado
                                        )
                                            .toLocaleString(
                                                "es-AR"
                                            )

                                        : "Todavía no hay copias"
                                }

                            </strong>

                        </p>


                        <p>
                            Ubicación:
                        </p>

                        <code>
                            {
                                estado
                                    .directorio
                            }
                        </code>

                    </>

                )}


                <div className="form-actions">

                    <button
                        type="button"
                        disabled={
                            procesando
                        }
                        onClick={
                            crearBackup
                        }
                    >
                        Crear copia de seguridad
                    </button>

                </div>

            </section>


            <section>

                <h2>
                    Restaurar copia
                </h2>


                <p>
                    Restaurar reemplaza los datos actuales por los contenidos en la copia seleccionada.
                </p>


                <p>
                    Antes de restaurar, el sistema guarda automáticamente una copia del estado actual.
                </p>


                <div className="form-actions">

                    <button
                        type="button"
                        disabled={
                            procesando
                        }
                        onClick={
                            restaurar
                        }
                    >
                        Restaurar copia de seguridad
                    </button>

                </div>

            </section>

        </div>

    );

}


export default Configuracion;