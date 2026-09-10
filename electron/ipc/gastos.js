import {
    handleProtegido
} from "../security/ipcPermissions.js";
import {
    listarCategoriasGasto,
    crearCategoriaGasto,
    actualizarCategoriaGasto,
    eliminarCategoriaGasto,

    registrarGasto,
    listarGastos,
    obtenerGasto,
    revertirGasto
} from "../database/repositories/gastosRepository.js";


const METODOS =
    new Set([
        "EFECTIVO",
        "TRANSFERENCIA",
        "DEBITO",
        "CREDITO",
        "QR",
        "OTRO"
    ]);


function validarId(
    valor,
    mensaje = "ID inválido."
) {

    const id =
        Number(valor);


    if (
        !Number.isInteger(id) ||
        id <= 0
    ) {

        throw new Error(
            mensaje
        );

    }


    return id;

}


function validarMonto(valor) {

    const monto =
        Number(valor);


    if (
        !Number.isFinite(monto) ||
        monto <= 0
    ) {

        throw new Error(
            "El monto debe ser mayor que cero."
        );

    }


    return monto;

}


function validarMetodo(valor) {

    const metodo =
        String(
            valor || ""
        )
            .trim()
            .toUpperCase();


    if (
        !METODOS.has(
            metodo
        )
    ) {

        throw new Error(
            "Método de pago inválido."
        );

    }


    return metodo;

}


function validarFecha(valor) {

    const fecha =
        valor
            ? new Date(valor)
            : new Date();


    if (
        Number.isNaN(
            fecha.getTime()
        )
    ) {

        throw new Error(
            "Fecha inválida."
        );

    }


    return fecha
        .toISOString();

}


function textoOpcional(valor) {

    return (
        valor?.trim() ||
        null
    );

}


function validarNombreCategoria(
    valor
) {

    const nombre =
        valor?.trim();


    if (
        !nombre ||
        nombre.length < 2
    ) {

        throw new Error(
            "El nombre de la categoría es inválido."
        );

    }


    return nombre;

}


export function registerGastosHandlers() {

    /*
     * CATEGORÍAS
     */

    handleProtegido(
        "gastos:categorias-listar",
        () =>
            listarCategoriasGasto()
    );


    handleProtegido(
        "gastos:categoria-crear",
        (_event, datos) =>

            crearCategoriaGasto(
                validarNombreCategoria(
                    datos?.nombre
                )
            )
    );


    handleProtegido(
        "gastos:categoria-actualizar",
        (_event, datos) =>

            actualizarCategoriaGasto({

                id:
                    validarId(
                        datos?.id
                    ),

                nombre:
                    validarNombreCategoria(
                        datos?.nombre
                    )

            })
    );


    handleProtegido(
        "gastos:categoria-eliminar",
        (_event, id) =>

            eliminarCategoriaGasto(
                validarId(id)
            )
    );


    /*
     * GASTOS
     */

    handleProtegido(
        "gastos:crear",
        (_event, datos) =>

            registrarGasto({

                categoriaId:
                    validarId(
                        datos?.categoria_id,
                        "Categoría inválida."
                    ),

                descripcion:
                    textoOpcional(
                        datos?.descripcion
                    ),

                monto:
                    validarMonto(
                        datos?.monto
                    ),

                fecha:
                    validarFecha(
                        datos?.fecha
                    ),

                metodoPago:
                    validarMetodo(
                        datos?.metodo_pago
                    ),

                notas:
                    textoOpcional(
                        datos?.notas
                    )

            })
    );


    handleProtegido(
        "gastos:listar",
        (_event, filtros = {}) => {

            const pagina =
                Math.max(
                    1,
                    Number(
                        filtros.pagina
                    ) || 1
                );


            const limite = 25;


            let estado =
                filtros.estado ||
                null;


            if (
                estado !== null &&
                ![
                    "ACTIVO",
                    "REVERTIDO"
                ].includes(
                    estado
                )
            ) {

                throw new Error(
                    "Estado inválido."
                );

            }


            const categoriaId =
                filtros.categoria_id
                    ? validarId(
                        filtros.categoria_id
                    )
                    : null;


            const metodoPago =
                filtros.metodo_pago
                    ? validarMetodo(
                        filtros.metodo_pago
                    )
                    : null;


            const resultado =
                listarGastos({

                    categoriaId,

                    metodoPago,

                    estado,

                    busqueda:
                        filtros.busqueda ||
                        "",

                    limite,

                    offset:
                        (
                            pagina - 1
                        ) * limite

                });


            return {

                ...resultado,

                pagina,

                totalPaginas:
                    Math.max(
                        1,
                        Math.ceil(
                            resultado.total /
                            limite
                        )
                    )

            };

        }
    );


    handleProtegido(
        "gastos:obtener",
        (_event, id) =>

            obtenerGasto(
                validarId(
                    id,
                    "ID de gasto inválido."
                )
            )
    );


    handleProtegido(
        "gastos:revertir",
        (_event, datos) => {

            const motivo =
                datos
                    ?.motivo
                    ?.trim();


            if (
                !motivo ||
                motivo.length < 3
            ) {

                throw new Error(
                    "Debe indicar el motivo de la reversión."
                );

            }


            return revertirGasto({

                gastoId:
                    validarId(
                        datos?.id,
                        "ID de gasto inválido."
                    ),

                motivo

            });

        }
    );

}