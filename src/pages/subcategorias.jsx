import { useEffect, useState } from "react";
const columnasSubcategorias = [
    {
        key: "id",
        label: "ID"
    },
    {
        key: "categoria_nombre",
        label: "Categoría"
    },
    {
        key: "nombre",
        label: "Subcategoría"
    }
];
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

            await window.electronAPI
                .subcategorias
                .eliminar(id);


            setSubcategorias((actuales) =>
                actuales.filter(
                    (subcategoria) =>
                        subcategoria.id !== id
                )
            );


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

                <FormActions
                    editando={Boolean(editandoId)}
                    onCancel={limpiarFormulario}
                />



            </form>


            {/* ======================== */}
            {/* TABLA */}
            {/* ======================== */}

            <CrudTable
                columns={columnasSubcategorias}
                items={subcategorias}
                onEdit={editarSubcategoria}
                onDelete={eliminarSubcategoria}
                emptyMessage="No hay subcategorías cargadas."
            />

        </div>

    );
}

export default Subcategorias;