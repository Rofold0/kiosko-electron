import {
    useState
} from "react";


function Activacion({
    estado,
    onActivada
}) {

    const [
        importando,
        setImportando
    ] =
        useState(false);


    const importarLicencia =
        async () => {

            if (
                importando
            ) {

                return;

            }


            setImportando(
                true
            );


            try {

                const resultado =
                    await window
                        .electronAPI
                        .licencia
                        .importar();


                if (
                    resultado.cancelada
                ) {

                    return;

                }


                if (
                    !resultado.valida
                ) {

                    await window
                        .electronAPI
                        .dialogos
                        .error(
                            resultado.error ||
                            "La licencia no es válida."
                        );

                    return;

                }


                onActivada(
                    resultado
                );


            } catch (error) {

                await window
                    .electronAPI
                    .dialogos
                    .error(
                        error?.message ||
                        String(error)
                    );


            } finally {

                setImportando(
                    false
                );

            }

        };


    return (

        <main className="auth-page">

            <section className="auth-card activation-card">

                <p className="activation-kicker">
                    CUADERNO DE VICIOS
                </p>


                <h1>
                    Activar aplicación
                </h1>


                <p>
                    Esta copia necesita una licencia
                    válida para este equipo.
                </p>


                <div className="form-field">

                    <label>
                        Código del equipo
                    </label>

                    <input
                        className="activation-code"
                        type="text"
                        readOnly
                        value={
                            estado
                                ?.codigo_equipo ||
                            ""
                        }
                    />

                </div>


                {estado?.error && (

                    <p className="activation-error">

                        {
                            estado.error
                        }

                    </p>

                )}


                <p className="activation-help">

                    Enviá este código para generar
                    la licencia correspondiente a
                    esta computadora.

                </p>


                <button
                    type="button"
                    onClick={
                        importarLicencia
                    }
                    disabled={
                        importando
                    }
                >

                    {
                        importando
                            ? "Importando..."
                            : "Importar licencia"
                    }

                </button>

            </section>

        </main>

    );

}


export default Activacion;