import Database from "better-sqlite3";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createSchema } from "./schemes";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// electron/database -> ../../database
const dbPath = path.join(__dirname, "../../database/kiosko.db");

const db = new Database(dbPath);

// Activa las foreign keys de SQLite
db.pragma("foreign_keys = ON");

//creacion de basededatos
createSchema(db);

export default db;