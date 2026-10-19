import {
    handleProtegido
} from "../security/ipcPermissions.js";

import {
    listarOfertas,
    obtenerOferta,
    buscarProductosOferta,
    crearOferta,
    actualizarOferta,
    cambiarActivoOferta
} from "../database/repositories/ofertasRepository.js";

import {
    auditar
} from "../security/audit.js";


const TIPOS =
    new Set([
        "PORCENTAJE",
        "PRECIO_FIJO"
    ]);


function validarId(
    valor
) {

    const id =
        Number(valor);


    if (
        !Number.isInteger(id) ||
        id <= 0
    ) {

        throw new Error(
            "ID inválido."
        );

    }


    return id;

}


function validarNombre(
    valor
) {

    const nombre =
        valor?.trim();


    if (
        !nombre ||
        nombre.length < 2
    ) {

        throw new Error(
            "El nombre de la oferta es obligatorio."
        );

    }


    return nombre;

}


function validarTipo(
    valor
) {

    const tipo =
        String(
            valor || ""
        )
            .trim()
            .toUpperCase();


    if (
        !TIPOS.has(
            tipo
        )
    ) {

        throw new Error(
            "Tipo de oferta inválido."
        );

    }


    return tipo;

}


function validarValor(
    valor,
    tipo
) {

    const numero =
        Number(valor);


    if (
        !Number.isFinite(
            numero
        ) ||
        numero <= 0
    ) {

        throw new Error(
            "El valor de la oferta es inválido."
        );

    }


    if (
        tipo ===
            "PORCENTAJE" &&
        numero > 100
    ) {

        throw new Error(
            "El porcentaje no puede superar 100%."
        );

    }


    return numero;

}


function validarFecha(
    valor
) {

    const fecha =
        new Date(valor);


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


function validarProductos(
    valores
) {

    if (
        !Array.isArray(
            valores
        ) ||
        valores.length === 0
    ) {

        throw new Error(
            "Debe seleccionar al menos un producto."
        );

    }


    return [
        ...new Set(
            valores.map(
                validarId
            )
        )
    ];

}


function validarDatos(
    datos
) {

    const tipo =
        validarTipo(
            datos?.tipo
        );


    const fechaDesde =
        validarFecha(
            datos?.fecha_desde
        );


    const fechaHasta =
        validarFecha(
            datos?.fecha_hasta
        );


    if (
        new Date(fechaHasta) <=
        new Date(fechaDesde)
    ) {

        throw new Error(
            "La fecha final debe ser posterior a la fecha inicial."
        );

    }


    return {

        nombre:
            validarNombre(
                datos?.nombre
            ),

        tipo,

        valor:
            validarValor(
                datos?.valor,
                tipo
            ),

        fechaDesde,
        fechaHasta,

        productoIds:
            validarProductos(
                datos?.producto_ids
            )

    };

}


export function registerOfertasHandlers() {

    handleProtegido(
        "ofertas:listar",
        () =>
            listarOfertas()
    );


    handleProtegido(
        "ofertas:obtener",

        (
            _event,
            id
        ) =>
            obtenerOferta(
                validarId(id)
            )
    );


    handleProtegido(
        "ofertas:productos",

        (
            _event,
            filtros = {}
        ) => {

            return buscarProductosOferta({

                busqueda:
                    filtros.busqueda ||
                    "",

                limite:
                    Math.min(
                        100,
                        Math.max(
                            1,
                            Number(
                                filtros.limite
                            ) ||
                            50
                        )
                    )

            });

        }
    );


    handleProtegido(
        "ofertas:crear",

        (
            event,
            datos
        ) => {

            const oferta =
                crearOferta(
                    validarDatos(
                        datos
                    )
                );


            auditar(
                event,
                {
                    modulo:
                        "OFERTAS",

                    accion:
                        "CREAR",

                    entidad:
                        "oferta",

                    entidadId:
                        oferta.id,

                    descripcion:
                        `Oferta "${oferta.nombre}" creada.`,

                    detalles: {
                        tipo:
                            oferta.tipo,

                        valor:
                            oferta.valor,

                        fecha_desde:
                            oferta.fecha_desde,

                        fecha_hasta:
                            oferta.fecha_hasta,

                        productos:
                            oferta.productos
                                .map(
                                    (item) =>
                                        item.id
                                )
                    }
                }
            );


            return oferta;

        }
    );


    handleProtegido(
        "ofertas:actualizar",

        (
            event,
            datos
        ) => {

            const id =
                validarId(
                    datos?.id
                );


            const oferta =
                actualizarOferta({

                    id,

                    ...validarDatos(
                        datos
                    )

                });


            auditar(
                event,
                {
                    modulo:
                        "OFERTAS",

                    accion:
                        "ACTUALIZAR",

                    entidad:
                        "oferta",

                    entidadId:
                        id,

                    descripcion:
                        `Oferta "${oferta.nombre}" actualizada.`
                }
            );


            return oferta;

        }
    );


    handleProtegido(
        "ofertas:cambiar-activo",

        (
            event,
            datos
        ) => {

            const id =
                validarId(
                    datos?.id
                );


            const oferta =
                cambiarActivoOferta({

                    id,

                    activo:
                        datos?.activo ===
                        true

                });


            auditar(
                event,
                {
                    modulo:
                        "OFERTAS",

                    accion:
                        oferta.activo
                            ? "ACTIVAR"
                            : "DESACTIVAR",

                    entidad:
                        "oferta",

                    entidadId:
                        id,

                    descripcion:
                        `Oferta "${oferta.nombre}" ${oferta.activo ? "activada" : "desactivada"}.`
                }
            );


            return oferta;

        }
    );

}