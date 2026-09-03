import { ipcMain } from "electron";
import db from "../database/database.js";

export function registerSubcategoriasHandlers() {

  ipcMain.removeHandler("subcategorias:listar");
  ipcMain.removeHandler("subcategorias:crear");
  ipcMain.removeHandler("subcategorias:actualizar");
  ipcMain.removeHandler("subcategorias:eliminar");

  // LISTAR
  ipcMain.handle("subcategorias:listar", () => {
    return db.prepare(`
      SELECT id, nombre
      FROM subcategorias
      WHERE activo = 1
      ORDER BY nombre ASC
    `).all();
  });


  // CREAR
  ipcMain.handle("subcategorias:crear", (event, subcategoria) => {

    const  nombre  = subcategoria?.nombre?.trim();

    if (!nombre) {
      throw new Error(
        "El nombre de la subcategoría es obligatorio."
      );
    }
    // Verificar duplicados
    const subcategoriaExistente = db.prepare(`
        SELECT id
        FROM subcategorias
        WHERE LOWER(nombre) = LOWER(?)
          AND activo = 1
        LIMIT 1
      `).get(nombre);


    if (subcategoriaExistente) {
      throw new Error(
        "Ya existe una subcategoría con ese nombre."
      );
    }

    const stmt = db.prepare(`
      INSERT INTO subcategorias (nombre)
      VALUES (?)
    `);
    try {

      const result = stmt.run(nombre);

      return {
        id: Number(result.lastInsertRowid),
        nombre
      };

    } catch (error) {

      if (
        error.code === "SQLITE_CONSTRAINT_UNIQUE"
      ) {
        throw new Error(
          "Ya existe una subcategoría con ese nombre."
        );
      }

      throw error;
    }

  }
  );


  // ACTUALIZAR
  ipcMain.handle("subcategorias:actualizar", (event, subcategoria) => {

    const id = subcategoria?.id;
    const nombre = subcategoria?.nombre?.trim();


    if (!id) {
      throw new Error(
        "ID de subcategoría inválido."
      );
    }


    if (!nombre) {
      throw new Error(
        "El nombre de la subcategoría es obligatorio."
      );
    }


    // Verificar que exista la subcategoría
    const subcategoriaActual = db.prepare(`
        SELECT id
        FROM subcategorias
        WHERE id = ?
          AND activo = 1
      `).get(id);


    if (!subcategoriaActual) {
      throw new Error(
        "La subcategoría no existe."
      );
    }


    // Verificar duplicados
    // IMPORTANTE: excluimos el ID que estamos editando
    const subcategoriaDuplicada = db.prepare(`
        SELECT id
        FROM subcategorias
        WHERE LOWER(nombre) = LOWER(?)
          AND id != ?
          AND activo = 1
        LIMIT 1
      `).get(nombre, id);


    if (subcategoriaDuplicada) {
      throw new Error(
        "Ya existe otra subcategoría con ese nombre."
      );
    }


    try {

      const result = db.prepare(`
          UPDATE subcategorias
          SET nombre = ?
          WHERE id = ?
            AND activo = 1
        `).run(nombre, id);


      if (result.changes === 0) {
        throw new Error(
          "No se pudo actualizar la subcategoría."
        );
      }


      return {
        id,
        nombre
      };

    } catch (error) {

      if (
        error.code === "SQLITE_CONSTRAINT_UNIQUE"
      ) {
        throw new Error(
          "Ya existe otra subcategoría con ese nombre."
        );
      }

      throw error;
    }

  }
  );


  // ELIMINAR
  ipcMain.handle(
    "subcategorias:eliminar",
    (_event, id) => {

      if (!id) {
        throw new Error(
          "ID de subcategoría inválido."
        );
      }


      const result = db.prepare(`
        UPDATE subcategorias
        SET activo = 0
        WHERE id = ?
          AND activo = 1
      `).run(id);


      if (result.changes === 0) {
        throw new Error(
          "La subcategoría no existe o ya fue eliminada."
        );
      }


      return {
        success: true
      };

    }
  );

}
