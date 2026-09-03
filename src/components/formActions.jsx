function FormActions({
    editando = false,
    onCancel,
    disabled = false
}) {

    return (
       <div className="form-actions">

            <button
                type="submit"
                disabled={disabled}
            >

                {editando
                    ? "Actualizar"
                    : "Agregar"
                }

            </button>


            {editando && onCancel && (

                <button
                    type="button"
                    onClick={onCancel}
                    disabled={disabled}
                >
                    Cancelar
                </button>

            )}

        </div>
    );
}

export default FormActions;