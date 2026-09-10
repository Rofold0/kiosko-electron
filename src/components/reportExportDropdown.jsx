import {
    useRef,
    useState
} from "react";


function ReportExportDropdown({
    disabled = false,
    onPdf,
    onCsv,
    onExcel,
    onPrint
}) {

    const detailsRef =
        useRef(null);


    const [
        procesando,
        setProcesando
    ] = useState(false);


    const ejecutar =
        async (accion) => {

            if (
                disabled ||
                procesando
            ) {
                return;
            }


            detailsRef.current
                ?.removeAttribute(
                    "open"
                );


            setProcesando(true);


            try {

                await accion();


            } finally {

                setProcesando(false);

            }

        };


    const bloqueado =
        disabled ||
        procesando;


    return (

        <details
            ref={detailsRef}
            className={
                bloqueado
                    ? "report-export report-export--disabled"
                    : "report-export"
            }
        >

            <summary
                aria-disabled={
                    bloqueado
                }
                onClick={(event) => {

                    if (bloqueado) {
                        event.preventDefault();
                    }

                }}
            >

                {
                    procesando
                        ? "Procesando..."
                        : "Exportar"
                }

                <span
                    aria-hidden="true"
                    className="report-export-arrow"
                >
                    ▾
                </span>

            </summary>


            <div
                className="report-export-menu"
                role="menu"
            >

                <button
                    type="button"
                    role="menuitem"
                    disabled={bloqueado}
                    onClick={() =>
                        ejecutar(onPdf)
                    }
                >
                    Exportar PDF
                </button>


                <button
                    type="button"
                    role="menuitem"
                    disabled={bloqueado}
                    onClick={() =>
                        ejecutar(onCsv)
                    }
                >
                    Exportar CSV
                </button>

                <button
                    type="button"
                    role="menuitem"
                    disabled={bloqueado}
                    onClick={() =>
                        ejecutar(
                            onExcel
                        )
                    }
                >
                    Exportar Excel
                </button>

                <button
                    type="button"
                    role="menuitem"
                    disabled={bloqueado}
                    onClick={() =>
                        ejecutar(onPrint)
                    }
                >
                    Imprimir
                </button>

            </div>

        </details>

    );

}


export default ReportExportDropdown;