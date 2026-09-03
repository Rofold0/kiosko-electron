import { useEffect, useState } from "react";

function Subcategorias() {

    const [subcategorias, setSubcategorias] = useState([]);

    const [nombre, setNombre] = useState("");

    const [editandoId, setEditandoId] = useState(null);

    // CARGAR SUBCATEGORÍAS

    const cargarSubcategorias = async () => {

        try {

            const data =
                await window.electronAPI.subcategorias.listar();

            setSubcategorias(data);

        } catch (error) {

            console.error(
                "Error cargando subcategorías:",
                error
            );

        }

    };

    // AL ABRIR LA PANTALLA

    useEffect(() => {

        cargarSubcategorias();

    }, []);


    // CREAR ACTUALIZAR

    const guardarSubcategoria = async (e) => {

        e.preventDefault();


        if (!nombre.trim()) {

            alert("Ingrese un nombre.");

            return;
        }


        try {

            if (editandoId) {

                await window.electronAPI.subcategorias.actualizar({
                    id: editandoId,
                    nombre
                });

            } else {

                await window.electronAPI.subcategorias.crear({
                    nombre
                });

            }


            setNombre("");
            setEditandoId(null);

            await cargarSubcategorias();


        } catch (error) {

            console.error(error);

            alert(error.message);

        }

    };



    // EDITAR


    const editarSubcategoria = (subcategoria) => {

        setEditandoId(subcategoria.id);

        setNombre(subcategoria.nombre);

    };


    // ELIMINAR

    const eliminarSubcategoria = async (id) => {

        const confirmar = window.confirm(
            "¿Está seguro de eliminar esta subcategoría?"
        );


        if (!confirmar) {
            return;
        }


        try {

            await window.electronAPI.subcategorias.eliminar(id);

            await cargarSubcategorias();


        } catch (error) {

            console.error(error);

            alert(error.message);

        }

    };

    // CANCELAR EDICIÓN
    const cancelarEdicion = () => {

        setEditandoId(null);

        setNombre("");

    };


    return (

        <div style={{ padding: "30px" }}>

            <h1>Subcategorías</h1>


            {/* FORMULARIO */}

            <form
                onSubmit={guardarSubcategoria}
                style={{
                    marginBottom: "30px"
                }}
            >

                <input
                    type="text"
                    placeholder="Nombre de la subcategoría"
                    value={nombre}
                    onChange={(e) =>
                        setNombre(e.target.value)
                    }
                />


                <button type="submit">

                    {editandoId
                        ? "Actualizar"
                        : "Agregar"}

                </button>


                {editandoId && (

                    <button
                        type="button"
                        onClick={cancelarEdicion}
                    >
                        Cancelar
                    </button>

                )}

            </form>


            {/* TABLA */}

            <table
                border="1"
                cellPadding="10"
                style={{
                    width: "100%",
                    borderCollapse: "collapse"
                }}
            >

                <thead>

                    <tr>

                        <th>ID</th>
                        <th>Nombre</th>
                        <th>Acciones</th>

                    </tr>

                </thead>


                <tbody>

                    {subcategorias.map((subcategoria) => (

                        <tr key={subcategoria.id}>

                            <td>
                                {subcategoria.id}
                            </td>


                            <td>
                                {subcategoria.nombre}
                            </td>


                            <td>

                                <button
                                    onClick={() =>
                                        editarSubcategoria(subcategoria)
                                    }
                                >
                                    Editar
                                </button>


                                <button
                                    onClick={() =>
                                        eliminarSubcategoria(subcategoria.id)
                                    }
                                >
                                    Eliminar
                                </button>

                            </td>

                        </tr>

                    ))}

                </tbody>

            </table>

        </div>

    );
}

export default Subcategorias;