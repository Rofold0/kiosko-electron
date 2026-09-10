import {
    useState
} from "react";

import {
    useAuth
} from "../auth/authContext.jsx";


function ConfiguracionInicial() {

    const {
        configurarInicial
    } =
        useAuth();


    const [
        nombre,
        setNombre
    ] = useState("");


    const [
        usuario,
        setUsuario
    ] = useState("admin");


    const [
        password,
        setPassword
    ] = useState("");


    const [
        repetir,
        setRepetir
    ] = useState("");


    const [
        guardando,
        setGuardando
    ] = useState(false);


    const guardar =
        async (event) => {

            event.preventDefault();


            if (
                password !==
                repetir
            ) {

                await window
                    .electronAPI
                    .dialogos
                    .error(
                        "Las contraseñas no coinciden."
                    );

                return;

            }


            setGuardando(true);


            try {

                await configurarInicial({

                    nombre,
                    usuario,
                    password

                });


            } catch (error) {

                await window
                    .electronAPI
                    .dialogos
                    .error(
                        error.message
                    );


            } finally {

                setGuardando(false);

            }

        };


    return (

        <main className="auth-page">

            <form
                className="auth-card"
                onSubmit={guardar}
            >

                <h1>
                    Configuración inicial
                </h1>


                <p>
                    Creá el administrador principal del sistema.
                </p>


                <div className="form-field">

                    <label>
                        Nombre
                    </label>

                    <input
                        autoFocus
                        value={nombre}
                        onChange={(event) =>
                            setNombre(
                                event.target.value
                            )
                        }
                    />

                </div>


                <div className="form-field">

                    <label>
                        Usuario
                    </label>

                    <input
                        value={usuario}
                        onChange={(event) =>
                            setUsuario(
                                event.target.value
                            )
                        }
                    />

                </div>


                <div className="form-field">

                    <label>
                        Contraseña
                    </label>

                    <input
                        type="password"
                        value={password}
                        onChange={(event) =>
                            setPassword(
                                event.target.value
                            )
                        }
                    />

                </div>


                <div className="form-field">

                    <label>
                        Repetir contraseña
                    </label>

                    <input
                        type="password"
                        value={repetir}
                        onChange={(event) =>
                            setRepetir(
                                event.target.value
                            )
                        }
                    />

                </div>


                <button
                    type="submit"
                    disabled={guardando}
                >

                    {
                        guardando
                            ? "Creando..."
                            : "Crear administrador"
                    }

                </button>

            </form>

        </main>

    );

}


export default ConfiguracionInicial;