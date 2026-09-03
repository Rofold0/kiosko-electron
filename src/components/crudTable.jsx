
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

        <div className="crud-table-wrapper">

            <table className="crud-table">

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
                                className="crud-table-empty"
                                colSpan={
                                    columns.length +
                                    (
                                        mostrarAcciones
                                            ? 1
                                            : 0
                                    )
                                }
                            >
                                {emptyMessage}
                            </td>

                        </tr>

                    ) : (

                        items.map((item) => (

                            <tr key={item.id}>

                                {columns.map(
                                    (column) => (

                                        <td
                                            key={
                                                column.key
                                            }
                                        >

                                            {
                                                column.render
                                                    ? column.render(
                                                        item
                                                    )
                                                    : item[
                                                        column.key
                                                    ]
                                            }

                                        </td>

                                    )
                                )}


                                {mostrarAcciones && (

                                    <td>

                                        <div className="table-actions">

                                            {onEdit && (

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        onEdit(
                                                            item
                                                        )
                                                    }
                                                >
                                                    Editar
                                                </button>

                                            )}


                                            {onDelete && (

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        onDelete(
                                                            item.id
                                                        )
                                                    }
                                                >
                                                    Eliminar
                                                </button>

                                            )}

                                        </div>

                                    </td>

                                )}

                            </tr>

                        ))

                    )}

                </tbody>

            </table>

        </div>

    );
}

export default CrudTable;