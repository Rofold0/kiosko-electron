import { ipcMain } from "electron";
import db from "../database/database.js";

export function registerCategoriasHandlers() {

  ipcMain.removeHandler("categorias:listar");
  ipcMain.removeHandler("categorias:crear");
  ipcMain.removeHandler("categorias:actualizar");
  ipcMain.removeHandler("categorias:eliminar");

  // LISTAR
  ipcMain.handle("categorias:listar", () => {
    return db.prepare(`
      SELECT id, nombre
      FROM categorias
      WHERE activo = 1
      ORDER BY nombre ASC
    `).all();
  });


  // CREAR
  ipcMain.handle("categorias:crear", (event, categoria) => {

    const  nombre  = categoria?.nombre?.trim();

    if (!nombre) {
      throw new Error(
        "El nombre de la categoría es obligatorio."
      );
    }
    // Verificar duplicados
    const categoriaExistente = db.prepare(`
        SELECT id
        FROM categorias
        WHERE LOWER(nombre) = LOWER(?)
          AND activo = 1
        LIMIT 1
      `).get(nombre);


    if (categoriaExistente) {
      throw new Error(
        "Ya existe una categoría con ese nombre."
      );
    }

    const stmt = db.prepare(`
      INSERT INTO categorias (nombre)
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
          "Ya existe una categoría con ese nombre."
        );
      }

      throw error;
    }

  }
  );


  // ACTUALIZAR
  ipcMain.handle("categorias:actualizar", (event, categoria) => {

    const id = categoria?.id;
    const nombre = categoria?.nombre?.trim();


    if (!id) {
      throw new Error(
        "ID de categoría inválido."
      );
    }


    if (!nombre) {
      throw new Error(
        "El nombre de la categoría es obligatorio."
      );
    }


    // Verificar que exista la categoría
    const categoriaActual = db.prepare(`
        SELECT id
        FROM categorias
        WHERE id = ?
          AND activo = 1
      `).get(id);


    if (!categoriaActual) {
      throw new Error(
        "La categoría no existe."
      );
    }


    // Verificar duplicados
    // IMPORTANTE: excluimos el ID que estamos editando
    const categoriaDuplicada = db.prepare(`
        SELECT id
        FROM categorias
        WHERE LOWER(nombre) = LOWER(?)
          AND id != ?
          AND activo = 1
        LIMIT 1
      `).get(nombre, id);


    if (categoriaDuplicada) {
      throw new Error(
        "Ya existe otra categoría con ese nombre."
      );
    }


    try {

      const result = db.prepare(`
          UPDATE categorias
          SET nombre = ?
          WHERE id = ?
            AND activo = 1
        `).run(nombre, id);


      if (result.changes === 0) {
        throw new Error(
          "No se pudo actualizar la categoría."
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
          "Ya existe otra categoría con ese nombre."
        );
      }

      throw error;
    }

  }
  );


  // ELIMINAR
  ipcMain.handle(
    "categorias:eliminar",
    (_event, id) => {

      if (!id) {
        throw new Error(
          "ID de categoría inválido."
        );
      }


      const result = db.prepare(`
        UPDATE categorias
        SET activo = 0
        WHERE id = ?
          AND activo = 1
      `).run(id);


      if (result.changes === 0) {
        throw new Error(
          "La categoría no existe o ya fue eliminada."
        );
      }


      return {
        success: true
      };

    }
  );

}
