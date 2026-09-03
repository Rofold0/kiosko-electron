import { useEffect, useState } from "react";
function ordenarSubcategorias(lista) {

    return [...lista].sort((a, b) => {

        const categoria =
            a.categoria_nombre.localeCompare(
                b.categoria_nombre,
                "es",
                {
                    sensitivity: "base"
                }
            );


        if (categoria !== 0) {
            return categoria;
        }


        return a.nombre.localeCompare(
            b.nombre,
            "es",
            {
                sensitivity: "base"
            }
        );

    });

}

function Subcategorias() {

    const [subcategorias, setSubcategorias] = useState([]);

    const [categorias, setCategorias] = useState([]);

    const [nombre, setNombre] = useState("");

    const [categoriaId, setCategoriaId] = useState("");

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

        cargarCategorias();
        cargarSubcategorias();

    }, []);


    //LIMPIAR FORMULARIO
     const limpiarFormulario = () => {

        setNombre("");
        setCategoriaId("");
        setEditandoId(null);

    };

    // CREAR ACTUALIZAR

    const guardarSubcategoria = async (e) => {

        e.preventDefault();

        if (!categoriaId) {

            alert("Seleccione una categoría.");

            return;
        }

        if (!nombre.trim()) {

            alert("Ingrese un nombre.");

            return;
        }

         const datos = {

            categoria_id:
                Number(categoriaId),

            nombre:
                nombre.trim()

        };

         try {

            if (editandoId) {

                const actualizada =
    await window.electronAPI
        .subcategorias
        .actualizar({
            id: editandoId,
            ...datos
        });


setSubcategorias((actuales) =>
    ordenarSubcategorias(
        actuales.map(
            (subcategoria) =>
                subcategoria.id ===
                actualizada.id
                    ? actualizada
                    : subcategoria
        )
    )
);

            } else {

                const nueva =
    await window.electronAPI
        .subcategorias
        .crear(datos);


setSubcategorias((actuales) =>
    ordenarSubcategorias([
        ...actuales,
        nueva
    ])
);

            }


            limpiarFormulario();

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

        setCategoriaId(String(subcategoria.categoria_id));

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

        if (editandoId === id) {

                limpiarFormulario();

            }
        } catch (error) {

            console.error(error);

            alert(error.message);

        }

    };

    return (

        <div style={{ padding: "30px" }}>

            <h1>Subcategorías</h1>


            {/* ======================== */}
            {/* FORMULARIO */}
            {/* ======================== */}

            <form
                onSubmit={guardarSubcategoria}
                style={{
                    marginBottom: "30px"
                }}
            >

                {/* CATEGORÍA */}

                <div
                    style={{
                        marginBottom: "10px"
                    }}
                >

                    <label>
                        Categoría:
                    </label>

                    <br />

                    <select
                        value={categoriaId}
                        onChange={(e) =>
                            setCategoriaId(
                                e.target.value
                            )
                        }
                    >

                        <option value="">
                            Seleccionar categoría
                        </option>


                        {categorias.map(
                            (categoria) => (

                                <option
                                    key={
                                        categoria.id
                                    }
                                    value={
                                        categoria.id
                                    }
                                >

                                    {
                                        categoria.nombre
                                    }

                                </option>

                            )
                        )}

                    </select>

                </div>


                {/* NOMBRE SUBCATEGORÍA */}

                <div
                    style={{
                        marginBottom: "10px"
                    }}
                >

                    <label>
                        Subcategoría:
                    </label>

                    <br />

                    <input
                        type="text"
                        placeholder="Nombre de la subcategoría"
                        value={nombre}
                        onChange={(e) =>
                            setNombre(
                                e.target.value
                            )
                        }
                    />

                </div>


                {/* BOTONES */}

                <button type="submit">

                    {editandoId
                        ? "Actualizar"
                        : "Agregar"}

                </button>


                {editandoId && (

                    <button
                        type="button"
                        onClick={
                            limpiarFormulario
                        }
                    >
                        Cancelar
                    </button>

                )}

            </form>


            {/* ======================== */}
            {/* TABLA */}
            {/* ======================== */}

            <table
                border="1"
                cellPadding="10"
                style={{
                    width: "100%",
                    borderCollapse:
                        "collapse"
                }}
            >

                <thead>

                    <tr>

                        <th>ID</th>

                        <th>
                            Categoría
                        </th>

                        <th>
                            Subcategoría
                        </th>

                        <th>
                            Acciones
                        </th>

                    </tr>

                </thead>


                <tbody>

                    {subcategorias.map(
                        (subcategoria) => (

                            <tr
                                key={
                                    subcategoria.id
                                }
                            >

                                <td>
                                    {
                                        subcategoria.id
                                    }
                                </td>


                                <td>
                                    {
                                        subcategoria
                                            .categoria_nombre
                                    }
                                </td>


                                <td>
                                    {
                                        subcategoria
                                            .nombre
                                    }
                                </td>


                                <td>

                                    <button
                                        onClick={() =>
                                            editarSubcategoria(
                                                subcategoria
                                            )
                                        }
                                    >
                                        Editar
                                    </button>


                                    <button
                                        onClick={() =>
                                            eliminarSubcategoria(
                                                subcategoria.id
                                            )
                                        }
                                    >
                                        Eliminar
                                    </button>

                                </td>

                            </tr>

                        )
                    )}

                </tbody>

            </table>

        </div>

    );
}

export default Subcategorias;