//MENU
export function createMenu() {

  const template = [

    {
      label: "Archivo",

      submenu: [
        {
          label: "Salir",
          role: "quit"
        }
      ]
    },


    {
      label: "Gestión",

      submenu: [
        {
          label: "Dashboard",

          click() {
            navigateTo("/");
          }
        },
        {
          label: "Categorías",

          click() {
            navigateTo("/categorias");
          }
        }
      ]
    }
  ];
  const menu = Menu.buildFromTemplate(template);

  Menu.setApplicationMenu(menu);
}