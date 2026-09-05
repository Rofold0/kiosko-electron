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

  },proveedores: {

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
