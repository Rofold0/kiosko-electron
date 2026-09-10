import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState
} from "react";
const AuthContext =
    createContext(null);


export function AuthProvider({
    children
}) {

    const [
        cargando,
        setCargando
    ] = useState(true);


    const [
        usuario,
        setUsuario
    ] = useState(null);


    const [
        requiereConfiguracion,
        setRequiereConfiguracion
    ] = useState(false);


    const cargarEstado =
        async () => {

            try {

                const estado =
                    await window
                        .electronAPI
                        .auth
                        .estado();


                setUsuario(
                    estado.usuario
                );


                setRequiereConfiguracion(
                    estado
                        .requiere_configuracion
                );


            } finally {

                setCargando(false);

            }

        };


    useEffect(() => {

        cargarEstado();

    }, []);


    const login =
        async (datos) => {

            const sesion =
                await window
                    .electronAPI
                    .auth
                    .login(
                        datos
                    );


            setUsuario(
                sesion
            );


            return sesion;

        };


    const configurarInicial =
        async (datos) => {

            const sesion =
                await window
                    .electronAPI
                    .auth
                    .configurarInicial(
                        datos
                    );


            setUsuario(
                sesion
            );


            setRequiereConfiguracion(
                false
            );

        };


    const logout =
        async () => {

            await window
                .electronAPI
                .auth
                .logout();


            setUsuario(
                null
            );

        };


    const puede =
        useCallback(
            (permiso) => {

                return Boolean(
                    usuario
                        ?.permisos
                        ?.includes(
                            permiso
                        )
                );

            },
            [usuario]
        );


    return (

        <AuthContext.Provider
            value={{
                cargando,
                usuario,
                requiereConfiguracion,
                login,
                logout,
                configurarInicial,
                puede
            }}
        >

            {children}

        </AuthContext.Provider>

    );

}


export function useAuth() {

    return useContext(
        AuthContext
    );

}