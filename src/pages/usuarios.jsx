import {
    useEffect,
    useState
} from "react";

import PageHeader
    from "../components/pageHeader.jsx";

import {
    useAuth
} from "../auth/authContext.jsx";


function Usuarios() {

    const {
        puede
    } =
        useAuth();


    const [
        usuarios,
        setUsuarios
    ] = useState([]);


    const [
        roles,
        setRoles
    ] = useState([]);


    const [
        permisos,
        setPermisos
    ] = useState([]);


    const [
        nombre,
        setNombre
    ] = useState("");


    const [
        usuario,
        setUsuario
    ] = useState("");


    const [
        password,
        setPassword
    ] = useState("");


    const [
        rolId,
        setRolId
    ] = useState("");


    const [
        rolEditando,
        setRolEditando
    ] = useState("");


    const [
        permisosRol,
        setPermisosRol
    ] = useState([]);


    const cargar =
        async () => {

            const [
                usuariosData,
                rolesData,
                permisosData
            ] =
                await Promise.all([

                    window
                        .electronAPI
                        .usuarios
                        .listar(),

                    window
                        .electronAPI
                        .usuarios
                        .roles(),

                    window
                        .electronAPI
                        .usuarios
                        .permisos()

                ]);


            setUsuarios(
                usuariosData
            );


            setRoles(
                rolesData
            );


            setPermisos(
                permisosData
            );


            if (
                !rolId &&
                rolesData.length > 0
            ) {

                setRolId(
                    String(
                        rolesData[0].id
                    )
                );

            }

        };


    useEffect(() => {

        cargar();

    }, []);


    const crear =
        async (event) => {

            event.preventDefault();


            try {

                await window
                    .electronAPI
                    .usuarios
                    .crear({

                        nombre,
                        usuario,
                        password,

                        rol_id:
                            Number(
                                rolId
                            )

                    });


                setNombre("");
                setUsuario("");
                setPassword("");


                await cargar();


            } catch (error) {

                await window
                    .electronAPI
                    .dialogos
                    .error(
                        error.message
                    );

            }

        };


    const cambiarActivo =
        async (
            item
        ) => {

            try {

                const confirmar =
                    await window
                        .electronAPI
                        .dialogos
                        .confirmar(
                            item.activo
                                ? `¿Desactivar a ${item.nombre}?`
                                : `¿Activar a ${item.nombre}?`
                        );


                if (!confirmar) {
                    return;
                }


                await window
                    .electronAPI
                    .usuarios
                    .cambiarActivo({

                        id:
                            item.id,

                        activo:
                            !Boolean(
                                item.activo
                            )

                    });


                await cargar();


            } catch (error) {

                await window
                    .electronAPI
                    .dialogos
                    .error(
                        error.message
                    );

            }

        };


    const seleccionarRol =
        (valor) => {

            setRolEditando(
                valor
            );


            const rol =
                roles.find(
                    (item) =>
                        String(
                            item.id
                        ) ===
                        String(valor)
                );


            setPermisosRol(
                rol
                    ?.permisos ||
                []
            );

        };


    const alternarPermiso =
        (permisoId) => {

            setPermisosRol(
                (actual) =>

                    actual.includes(
                        permisoId
                    )

                        ? actual.filter(
                            (id) =>
                                id !==
                                permisoId
                        )

                        : [
                            ...actual,
                            permisoId
                        ]

            );

        };


    const guardarPermisos =
        async () => {

            try {

                await window
                    .electronAPI
                    .roles
                    .actualizarPermisos({

                        rol_id:
                            Number(
                                rolEditando
                            ),

                        permisos:
                            permisosRol

                    });


                await cargar();


            } catch (error) {

                await window
                    .electronAPI
                    .dialogos
                    .error(
                        error.message
                    );

            }

        };


    return (

        <div className="page">

            <PageHeader
                title="Usuarios"
            />


            {puede(
                "usuarios.crear"
            ) && (

                <section>

                    <h2>
                        Nuevo usuario
                    </h2>


                    <form
                        className="users-form"
                        onSubmit={crear}
                    >

                        <div className="form-field">

                            <label>
                                Nombre
                            </label>

                            <input
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
                                Rol
                            </label>

                            <select
                                value={rolId}
                                onChange={(event) =>
                                    setRolId(
                                        event.target.value
                                    )
                                }
                            >

                                {roles.map(
                                    (rol) => (

                                        <option
                                            key={rol.id}
                                            value={rol.id}
                                        >
                                            {rol.nombre}
                                        </option>

                                    )
                                )}

                            </select>

                        </div>


                        <button type="submit">
                            Crear usuario
                        </button>

                    </form>

                </section>

            )}


            <section>

                <h2>
                    Usuarios
                </h2>


                <div className="report-table-wrapper">

                    <table className="report-table">

                        <thead>

                            <tr>
                                <th>Nombre</th>
                                <th>Usuario</th>
                                <th>Rol</th>
                                <th>Estado</th>
                                <th>Último acceso</th>
                                <th></th>
                            </tr>

                        </thead>


                        <tbody>

                            {usuarios.map(
                                (item) => (

                                    <tr
                                        key={item.id}
                                    >

                                        <td>
                                            {item.nombre}
                                        </td>

                                        <td>
                                            {item.usuario}
                                        </td>

                                        <td>
                                            {item.rol_nombre}
                                        </td>

                                        <td>
                                            {
                                                item.activo
                                                    ? "Activo"
                                                    : "Inactivo"
                                            }
                                        </td>

                                        <td>
                                            {
                                                item.ultimo_acceso
                                                    ? new Date(
                                                        item.ultimo_acceso
                                                    )
                                                        .toLocaleString(
                                                            "es-AR"
                                                        )
                                                    : "Nunca"
                                            }
                                        </td>

                                        <td>

                                            {puede(
                                                "usuarios.desactivar"
                                            ) && (

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        cambiarActivo(
                                                            item
                                                        )
                                                    }
                                                >

                                                    {
                                                        item.activo
                                                            ? "Desactivar"
                                                            : "Activar"
                                                    }

                                                </button>

                                            )}

                                        </td>

                                    </tr>

                                )
                            )}

                        </tbody>

                    </table>

                </div>

            </section>


            {puede(
                "roles.modificar"
            ) && (

                <section>

                    <h2>
                        Roles y permisos
                    </h2>


                    <div className="form-field">

                        <label>
                            Rol
                        </label>

                        <select
                            value={rolEditando}
                            onChange={(event) =>
                                seleccionarRol(
                                    event.target.value
                                )
                            }
                        >

                            <option value="">
                                Seleccionar
                            </option>


                            {roles.map(
                                (rol) => (

                                    <option
                                        key={rol.id}
                                        value={rol.id}
                                        disabled={
                                            rol.clave ===
                                            "ADMIN"
                                        }
                                    >
                                        {rol.nombre}
                                    </option>

                                )
                            )}

                        </select>

                    </div>


                    {rolEditando && (

                        <div className="permissions-grid">

                            {permisos.map(
                                (permiso) => (

                                    <label
                                        key={
                                            permiso.id
                                        }
                                        className="permission-item"
                                    >

                                        <input
                                            type="checkbox"
                                            checked={
                                                permisosRol
                                                    .includes(
                                                        permiso.id
                                                    )
                                            }
                                            onChange={() =>
                                                alternarPermiso(
                                                    permiso.id
                                                )
                                            }
                                        />

                                        <span>

                                            <strong>
                                                {
                                                    permiso.clave
                                                }
                                            </strong>

                                            <small>
                                                {
                                                    permiso.descripcion
                                                }
                                            </small>

                                        </span>

                                    </label>

                                )
                            )}


                            <button
                                type="button"
                                onClick={
                                    guardarPermisos
                                }
                            >
                                Guardar permisos
                            </button>

                        </div>

                    )}

                </section>

            )}

        </div>

    );

}


export default Usuarios;