import {
    useState
} from "react";

import {
    useAuth
} from "../auth/authContext.jsx";


function Login() {

    const {
        login
    } =
        useAuth();


    const [
        usuario,
        setUsuario
    ] = useState("");


    const [
        password,
        setPassword
    ] = useState("");


    const [
        cargando,
        setCargando
    ] = useState(false);


    const enviar =
        async (event) => {

            event.preventDefault();


            if (cargando) {
                return;
            }


            setCargando(true);


            try {

                await login({

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

                setCargando(false);

            }

        };


    return (

        <main className="auth-page">

            <form
                className="auth-card"
                onSubmit={enviar}
            >

                <h1>
                    Iniciar sesión
                </h1>


                <div className="form-field">

                    <label>
                        Usuario
                    </label>

                    <input
                        autoFocus
                        autoComplete="username"
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
                        autoComplete="current-password"
                        value={password}
                        onChange={(event) =>
                            setPassword(
                                event.target.value
                            )
                        }
                    />

                </div>


                <button
                    type="submit"
                    disabled={cargando}
                >
                    {
                        cargando
                            ? "Ingresando..."
                            : "Ingresar"
                    }
                </button>

            </form>

        </main>

    );

}


export default Login;