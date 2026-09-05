import {
    useEffect,
    useState
} from "react";
import CrudTable from "../components/crudTable.jsx";
import FormActions from "../components/formActions.jsx";



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

            await window.electronAPI
    .dialogos
    .error(
        "Seleccione una categoría."
    );

            return;
        }

        if (!nombre.trim()) {

            await window.electronAPI
    .dialogos
    .error(
        "Ingrese un nombre."
    );

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

            

        }

    };



    // EDITAR


    const editarSubcategoria =
    (subcategoria) => {

        setEditandoId(
            subcategoria.id
        );

        setNombre(
            subcategoria.nombre
        );

        setCategoriaId(
            String(
                subcategoria.categoria_id
            )
        );

    };


    // ELIMINAR

    const eliminarSubcategoria =
    async (id) => {

        const confirmar =
            await window.electronAPI
                .dialogos
                .confirmar(
                    "¿Está seguro de eliminar esta subcategoría?"
                );


        if (!confirmar) {
            return;
        }


        try {

            await window.electronAPI
                .subcategorias
                .eliminar(id);


            setSubcategorias(
                (actuales) =>
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

            await window.electronAPI
                .dialogos
                .error(
                    error.message
                );

        }

    };

    return (

    <div className="page">

        <h1>Subcategorías</h1>


        <form
            className="
                crud-form
                crud-form--multiple
            "
            onSubmit={
                guardarSubcategoria
            }
        >

            <div className="form-field">

                <label
                    htmlFor=
                        "subcategoria-categoria"
                >
                    Categoría
                </label>

                <select
    
    id="subcategoria-categoria"
    value={categoriaId}
    onChange={(e) =>
        setCategoriaId(e.target.value)
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


            <div className="form-field">

                <label
                    htmlFor=
                        "subcategoria-nombre"
                >
                    Subcategoría
                </label>

                <input
    
    id="subcategoria-nombre"
    type="text"
    placeholder="Nombre de la subcategoría"
    value={nombre}
    onChange={(e) =>
        setNombre(e.target.value)
    }
/>

            </div>


            <FormActions
                editando={
                    Boolean(editandoId)
                }
                onCancel={
                    limpiarFormulario
                }
            />

        </form>


        <CrudTable
            columns={
                columnasSubcategorias
            }
            items={subcategorias}
            onEdit={
                editarSubcategoria
            }
            onDelete={
                eliminarSubcategoria
            }
            emptyMessage=
                "No hay subcategorías cargadas."
        />

    </div>

);  
}

export default Subcategorias;