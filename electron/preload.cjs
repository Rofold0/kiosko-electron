const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {

  dialogos: {

    confirmar: (mensaje) =>
      ipcRenderer.invoke(
        "dialogos:confirmar",
        mensaje
      ),

    error: (mensaje) =>
      ipcRenderer.invoke(
        "dialogos:error",
        mensaje
      )

  },
  auth: {

    estado: () =>
        ipcRenderer.invoke(
            "auth:estado"
        ),

    configurarInicial: (datos) =>
        ipcRenderer.invoke(
            "auth:configurar-inicial",
            datos
        ),

    login: (datos) =>
        ipcRenderer.invoke(
            "auth:login",
            datos
        ),

    logout: () =>
        ipcRenderer.invoke(
            "auth:logout"
        )

},


usuarios: {

    listar: () =>
        ipcRenderer.invoke(
            "usuarios:listar"
        ),

    roles: () =>
        ipcRenderer.invoke(
            "usuarios:roles"
        ),

    permisos: () =>
        ipcRenderer.invoke(
            "usuarios:permisos"
        ),

    crear: (datos) =>
        ipcRenderer.invoke(
            "usuarios:crear",
            datos
        ),

    actualizar: (datos) =>
        ipcRenderer.invoke(
            "usuarios:actualizar",
            datos
        ),

    cambiarPassword: (datos) =>
        ipcRenderer.invoke(
            "usuarios:cambiar-password",
            datos
        ),

    cambiarActivo: (datos) =>
        ipcRenderer.invoke(
            "usuarios:cambiar-activo",
            datos
        )

},


roles: {

    actualizarPermisos: (datos) =>
        ipcRenderer.invoke(
            "roles:actualizar-permisos",
            datos
        )

},
auditoria: {

    listar: (filtros) =>
        ipcRenderer.invoke(
            "auditoria:listar",
            filtros
        )

},
  subcategorias: {

    listar: () =>
      ipcRenderer.invoke(
        "subcategorias:listar"
      ),

    crear: (subcategoria) =>
      ipcRenderer.invoke(
        "subcategorias:crear",
        subcategoria
      ),

    actualizar: (subcategoria) =>
      ipcRenderer.invoke(
        "subcategorias:actualizar",
        subcategoria
      ),

    eliminar: (id) =>
      ipcRenderer.invoke(
        "subcategorias:eliminar",
        id
      )

  },
  categorias: {
    listar: () =>
      ipcRenderer.invoke("categorias:listar"),

    crear: (categoria) =>
      ipcRenderer.invoke("categorias:crear", categoria),

    actualizar: (categoria) =>
      ipcRenderer.invoke("categorias:actualizar", categoria),

    eliminar: (id) =>
      ipcRenderer.invoke("categorias:eliminar", id)
  },
  productos: {

    listar: (filtros) =>
      ipcRenderer.invoke(
        "productos:listar",
        filtros
      ),

    crear: (producto) =>
      ipcRenderer.invoke(
        "productos:crear",
        producto
      ),

    actualizar: (producto) =>
      ipcRenderer.invoke(
        "productos:actualizar",
        producto
      ),

    eliminar: (id) =>
      ipcRenderer.invoke(
        "productos:eliminar",
        id
      )

  }, stock: {

    entrada: (datos) =>
      ipcRenderer.invoke(
        "stock:entrada",
        datos
      ),

    salida: (datos) =>
      ipcRenderer.invoke(
        "stock:salida",
        datos
      ),

    ajustar: (datos) =>
      ipcRenderer.invoke(
        "stock:ajustar",
        datos
      ),

    movimientos: (filtros) =>
      ipcRenderer.invoke(
        "stock:movimientos",
        filtros
      ),

    bajoMinimo: () =>
      ipcRenderer.invoke(
        "stock:bajo-minimo"
      )

  },
  listaCompras: {

    actual: () =>
      ipcRenderer.invoke(
        "lista-compras:actual"
      ),

    agregarProducto: (datos) =>
      ipcRenderer.invoke(
        "lista-compras:agregar-producto",
        datos
      ),

    agregarLibre: (datos) =>
      ipcRenderer.invoke(
        "lista-compras:agregar-libre",
        datos
      ),

    actualizarCantidad: (datos) =>
      ipcRenderer.invoke(
        "lista-compras:cantidad",
        datos
      ),

    marcarComprado: (datos) =>
      ipcRenderer.invoke(
        "lista-compras:comprado",
        datos
      ),

    eliminarItem: (id) =>
      ipcRenderer.invoke(
        "lista-compras:eliminar-item",
        id
      ),

    actualizarNotas: (notas) =>
      ipcRenderer.invoke(
        "lista-compras:notas",
        notas
      ),

    agregarStockBajo: () =>
      ipcRenderer.invoke(
        "lista-compras:agregar-stock-bajo"
      ),

    historial: () =>
      ipcRenderer.invoke(
        "lista-compras:historial"
      ),

    obtener: (id) =>
      ipcRenderer.invoke(
        "lista-compras:obtener",
        id
      ),

    completar: () =>
      ipcRenderer.invoke(
        "lista-compras:completar"
      )

  }, proveedores: {

    listar: () =>
      ipcRenderer.invoke(
        "proveedores:listar"
      ),

    crear: (proveedor) =>
      ipcRenderer.invoke(
        "proveedores:crear",
        proveedor
      ),

    actualizar: (proveedor) =>
      ipcRenderer.invoke(
        "proveedores:actualizar",
        proveedor
      ),

    eliminar: (id) =>
      ipcRenderer.invoke(
        "proveedores:eliminar",
        id
      ),

    productos: (proveedorId) =>
      ipcRenderer.invoke(
        "proveedores:productos",
        proveedorId
      ),

    porProducto: (productoId) =>
      ipcRenderer.invoke(
        "proveedores:por-producto",
        productoId
      ),

    vincularProducto: (datos) =>
      ipcRenderer.invoke(
        "proveedores:vincular-producto",
        datos
      ),

    actualizarVinculo: (datos) =>
      ipcRenderer.invoke(
        "proveedores:actualizar-vinculo",
        datos
      ),

    desvincularProducto: (id) =>
      ipcRenderer.invoke(
        "proveedores:desvincular-producto",
        id
      )

  }, compras: {
    revertir: (datos) =>
      ipcRenderer.invoke(
        "compras:revertir",
        datos
      ),

    crear: (datos) =>
      ipcRenderer.invoke(
        "compras:crear",
        datos
      ),

    pendientesProveedor: (proveedorId) =>
      ipcRenderer.invoke(
        "compras:pendientes-proveedor",
        proveedorId
      ),

    listar: (filtros) =>
      ipcRenderer.invoke(
        "compras:listar",
        filtros
      ),

    obtener: (id) =>
      ipcRenderer.invoke(
        "compras:obtener",
        id
      )

  },
  precios: {

    listar: (filtros) =>
      ipcRenderer.invoke(
        "precios:listar",
        filtros
      ),

    detalle: (productoId) =>
      ipcRenderer.invoke(
        "precios:detalle",
        productoId
      ),

    vigente: (productoId) =>
      ipcRenderer.invoke(
        "precios:vigente",
        productoId
      ),

    guardar: (datos) =>
      ipcRenderer.invoke(
        "precios:guardar",
        datos
      )

  },
  ventas: {

    productos: (filtros) =>
      ipcRenderer.invoke(
        "ventas:productos",
        filtros
      ),

    crear: (datos) =>
      ipcRenderer.invoke(
        "ventas:crear",
        datos
      ),

    listar: (filtros) =>
      ipcRenderer.invoke(
        "ventas:listar",
        filtros
      ),

    obtener: (id) =>
      ipcRenderer.invoke(
        "ventas:obtener",
        id
      ),

    revertir: (datos) =>
      ipcRenderer.invoke(
        "ventas:revertir",
        datos
      )

  },
  caja: {

    actual: () =>
      ipcRenderer.invoke(
        "caja:actual"
      ),

    abrir: (datos) =>
      ipcRenderer.invoke(
        "caja:abrir",
        datos
      ),

    cerrar: (datos) =>
      ipcRenderer.invoke(
        "caja:cerrar",
        datos
      ),

    movimientoManual: (datos) =>
      ipcRenderer.invoke(
        "caja:movimiento-manual",
        datos
      ),

    revertirManual: (datos) =>
      ipcRenderer.invoke(
        "caja:revertir-manual",
        datos
      ),

    movimientos: (filtros) =>
      ipcRenderer.invoke(
        "caja:movimientos",
        filtros
      ),

    historial: (filtros) =>
      ipcRenderer.invoke(
        "caja:historial",
        filtros
      ),

    obtener: (id) =>
      ipcRenderer.invoke(
        "caja:obtener",
        id
      )

  },
  gastos: {

    categorias: {

      listar: () =>
        ipcRenderer.invoke(
          "gastos:categorias-listar"
        ),

      crear: (datos) =>
        ipcRenderer.invoke(
          "gastos:categoria-crear",
          datos
        ),

      actualizar: (datos) =>
        ipcRenderer.invoke(
          "gastos:categoria-actualizar",
          datos
        ),

      eliminar: (id) =>
        ipcRenderer.invoke(
          "gastos:categoria-eliminar",
          id
        )

    },

    crear: (datos) =>
      ipcRenderer.invoke(
        "gastos:crear",
        datos
      ),

    listar: (filtros) =>
      ipcRenderer.invoke(
        "gastos:listar",
        filtros
      ),

    obtener: (id) =>
      ipcRenderer.invoke(
        "gastos:obtener",
        id
      ),

    revertir: (datos) =>
      ipcRenderer.invoke(
        "gastos:revertir",
        datos
      )

  },
  reportes: {

    dashboard: (filtros) =>
      ipcRenderer.invoke(
        "reportes:dashboard",
        filtros
      ),

    exportarPdf: (filtros) =>
      ipcRenderer.invoke(
        "reportes:exportar-pdf",
        filtros
      ),

    exportarCsv: (datos) =>
      ipcRenderer.invoke(
        "reportes:exportar-csv",
        datos
      ),

    exportarExcel: (datos) =>
    ipcRenderer.invoke(
        "reportes:exportar-excel",
        datos
    ),

    imprimir: () =>
      ipcRenderer.invoke(
        "reportes:imprimir"
      )

  },

  // Navegación desde el menú de Electron hacia React
  onNavigate: (callback) => {
    const listener = (_event, ruta) => {
      callback(ruta);
    };

    ipcRenderer.on("navigate", listener);

    return () => {
      ipcRenderer.removeListener("navigate", listener);
    };
  }
});
