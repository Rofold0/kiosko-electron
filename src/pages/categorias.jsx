import {
    useCallback,
    useEffect,
    useRef,
    useState
} from "react";
import CrudTable from "../components/crudTable.jsx";
import FormActions from "../components/formActions.jsx";

const columnasCategorias = [
    {
        key: "id",
        label: "ID"
    },
    {
        key: "nombre",
        label: "Nombre"
    }
];
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

    const inputRef = useRef(null);

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

        const nombreLimpio =
            nombre.trim();


        if (!nombreLimpio) {

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
                            nombre: nombreLimpio
                        });


                setCategorias((actuales) =>
                    ordenarCategorias(
                        actuales.map(
                            (categoria) =>
                                categoria.id === actualizada.id
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
                            nombre: nombreLimpio
                        });


                setCategorias((actuales) =>
                    ordenarCategorias([
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


    const editarCategoria = useCallback(
    (categoria) => {

        setEditandoId(categoria.id);
        setNombre(categoria.nombre);

        requestAnimationFrame(() => {
            inputRef.current?.focus();
        });

    },
    []
);


    // ELIMINAR

    const eliminarCategoria = useCallback(
    async (id) => {

        const confirmar =
            window.confirm(
                "¿Está seguro de eliminar esta categoría?"
            );

        if (!confirmar) {
            return;
        }

        try {

            await window.electronAPI
                .categorias
                .eliminar(id);


            setCategorias((actuales) =>
                actuales.filter(
                    (categoria) =>
                        categoria.id !== id
                )
            );


            if (editandoId === id) {

                setNombre("");
                setEditandoId(null);

            }


            requestAnimationFrame(() => {
                inputRef.current?.focus();
            });


        } catch (error) {

            console.error(error);
            alert(error.message);

        }

    },
    [editandoId]
);

    // CANCELAR EDICIÓN / LIMPIAR FORMULARIO
   const limpiarFormulario = useCallback(() => {

    setNombre("");
    setEditandoId(null);

    requestAnimationFrame(() => {
        inputRef.current?.focus();
    });

}, []);


    return (

        <div className="page">

            <h1>Categorías</h1>


            <form
                className="crud-form"
                onSubmit={guardarCategoria}
            >

                <div className="form-field">

                    <label htmlFor="categoria-nombre">
                        Nombre
                    </label>

                    <input
                        ref={inputRef}
                        id="categoria-nombre"
                        type="text"
                        placeholder="Nombre de la categoría"
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
                    columnasCategorias
                }
                items={categorias}
                onEdit={
                    editarCategoria
                }
                onDelete={
                    eliminarCategoria
                }
                emptyMessage=
                "No hay categorías cargadas."
            />

        </div>

    );
}

export default Categorias;