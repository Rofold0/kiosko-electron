import { useEffect, useState } from "react";

function ordenarCategorias(lista) {

    return [...lista].sort(
        (a, b) =>
            a.nombre.localeCompare(
                b.nombre,
                "es",
                {
                    sensitivity: "base"
                }
            )
    );

}

function Categorias() {

    const [categorias, setCategorias] = useState([]);

    const [nombre, setNombre] = useState("");

    const [editandoId, setEditandoId] = useState(null);

    // CARGAR CATEGORÍAS 

    const cargarCategorias = async () => {

        try {

            const data =
                await window.electronAPI.categorias.listar();

            setCategorias(data);

        } catch (error) {

            console.error(
                "Error cargando categorías:",
                error
            );

        }

    };

    // AL ABRIR LA PANTALLA

    useEffect(() => {

        cargarCategorias();

    }, []);


    // CREAR ACTUALIZAR

    const guardarCategoria = async (e) => {

        e.preventDefault();


        if (!nombre.trim()) {

            alert("Ingrese un nombre.");

            return;
        }


        try {

            if (editandoId) {

                const actualizada =
    await window.electronAPI
        .categorias
        .actualizar({
            id: editandoId,
            nombre: nombre.trim()
        });


setCategorias((actuales) =>
    ordenarCategorias(
        actuales.map(
            (categoria) =>
                categoria.id ===
                actualizada.id
                    ? actualizada
                    : categoria
        )
    )
);


            } else {

                const nueva =
    await window.electronAPI
        .categorias
        .crear({
            nombre: nombre.trim()
        });


setCategorias((actuales) =>
    ordenarCategorias([
        ...actuales,
        nueva
    ])
);

            }


            




        } catch (error) {

            console.error(error);

            alert(error.message);

        }

    };



    // EDITAR


    const editarCategoria = (categoria) => {

        setEditandoId(categoria.id);

        setNombre(categoria.nombre);

    };


    // ELIMINAR

    const eliminarCategoria = async (id) => {

        const confirmar = window.confirm(
            "¿Está seguro de eliminar esta categoría?"
        );


        if (!confirmar) {
            return;
        }


        try {

            await window.electronAPI.categorias.eliminar(id);
            setCategorias((actuales) =>
    actuales.filter(
        (categoria) =>
            categoria.id !== id
    )
);

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

            <h1>Categorías</h1>


            {/* FORMULARIO */}

            <form
                onSubmit={guardarCategoria}
                style={{
                    marginBottom: "30px"
                }}
            >

                <input
                    type="text"
                    placeholder="Nombre de la categoría"
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

                    {categorias.map((categoria) => (

                        <tr key={categoria.id}>

                            <td>
                                {categoria.id}
                            </td>


                            <td>
                                {categoria.nombre}
                            </td>


                            <td>

                                <button
                                    onClick={() =>
                                        editarCategoria(categoria)
                                    }
                                >
                                    Editar
                                </button>


                                <button
                                    onClick={() =>
                                        eliminarCategoria(categoria.id)
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

export default Categorias;