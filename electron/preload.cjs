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
