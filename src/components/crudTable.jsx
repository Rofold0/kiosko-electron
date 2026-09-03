function CrudTable({
    columns,
    items,
    onEdit,
    onDelete,
    emptyMessage = "No hay registros."
}) {

    const mostrarAcciones =
        Boolean(onEdit || onDelete);


    return (
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

                    {columns.map((column) => (

                        <th key={column.key}>
                            {column.label}
                        </th>

                    ))}


                    {mostrarAcciones && (
                        <th>Acciones</th>
                    )}

                </tr>

            </thead>


            <tbody>

                {items.length === 0 ? (

                    <tr>

                        <td
                            colSpan={
                                columns.length +
                                (mostrarAcciones ? 1 : 0)
                            }
                            style={{
                                textAlign: "center"
                            }}
                        >
                            {emptyMessage}
                        </td>

                    </tr>

                ) : (

                    items.map((item) => (

                        <tr key={item.id}>

                            {columns.map((column) => (

                                <td key={column.key}>

                                    {column.render
                                        ? column.render(item)
                                        : item[column.key]
                                    }

                                </td>

                            ))}


                            {mostrarAcciones && (

                                <td>

                                    {onEdit && (

                                        <button
                                            type="button"
                                            onClick={() =>
                                                onEdit(item)
                                            }
                                        >
                                            Editar
                                        </button>

                                    )}


                                    {onDelete && (

                                        <button
                                            type="button"
                                            onClick={() =>
                                                onDelete(item.id)
                                            }
                                        >
                                            Eliminar
                                        </button>

                                    )}

                                </td>

                            )}

                        </tr>

                    ))

                )}

            </tbody>

        </table>
    );
}

export default CrudTable;