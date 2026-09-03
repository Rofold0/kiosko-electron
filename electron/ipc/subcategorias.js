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
      SELECT
    s.id,
    s.nombre,
    s.categoria_id,
    c.nombre AS categoria_nombre

    FROM subcategorias s

    JOIN categorias c
    ON c.id = s.categoria_id
    WHERE
    s.activo = 1
    AND c.activo = 1
    
    ORDER BY
    c.nombre ASC,
    s.nombre ASC
    `).all();
  });


  // CREAR
  ipcMain.handle("subcategorias:crear", (event, subcategoria) => {

    const nombre = subcategoria?.nombre?.trim();
    const categoria_id = Number(subcategoria?.categoria_id);

    if (!categoria_id) {

      throw new Error(
        "Debe seleccionar una categoría."
      );

    }

    if (!nombre) {
      throw new Error(
        "El nombre de la subcategoría es obligatorio."
      );
    }
    // Verificar que la categoría exista y esté activa
    const categoriaExiste =
      db.prepare(`
                SELECT id
                FROM categorias
                WHERE id = ?
                  AND activo = 1
            `).get(categoria_id);


    if (!categoriaExiste) {

      throw new Error(
        "La categoría seleccionada no existe."
      );

    }

    // Verificar subcategorias duplicadas y existentes 
    const subcategoriaExistente = db.prepare(`
        SELECT id
        FROM subcategorias
        WHERE categoria_id = ?
          AND LOWER(nombre) = LOWER(?)
          AND activo = 1
        LIMIT 1
      `).get(categoria_id, nombre);


    if (subcategoriaExistente) {
      throw new Error(
        "Ya existe una subcategoría con ese nombre."
      );
    }

    const stmt =
      db.prepare(`
                INSERT INTO subcategorias (
                    categoria_id,
                    nombre
                )
                VALUES (?, ?)
            `);
    const result =
      stmt.run(
        categoria_id,
        nombre
      );
    return {

      id:
        Number(
          result.lastInsertRowid
        ),

      categoria_id,

      nombre

    };
  })




// ACTUALIZAR
ipcMain.handle("subcategorias:actualizar", (event, subcategoria) => {

  const id =
    Number(subcategoria?.id);

  const categoria_id =
    Number(
      subcategoria?.categoria_id
    );

  const nombre =
    subcategoria?.nombre?.trim();


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

    WHERE categoria_id = ?
      AND LOWER(nombre) = LOWER(?)
      AND id != ?
      AND activo = 1

    LIMIT 1
`).get(
    categoria_id,
    nombre,
    id
);


  if (subcategoriaDuplicada) {
    throw new Error(
      "Ya existe otra subcategoría con ese nombre."
    );
  }


  try {

    const result = db.prepare(`
    UPDATE subcategorias

    SET
        categoria_id = ?,
        nombre = ?

    WHERE id = ?
      AND activo = 1
`).run(
    categoria_id,
    nombre,
    id
);


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
