import Database
    from "better-sqlite3";

import {
    app
} from "electron";

import fs
    from "node:fs";

import path
    from "node:path";

import {
    fileURLToPath
} from "node:url";

import {
    createSchema
} from "./schema.js";

import {
    runMigrations
} from "./migrations.js";


const __filename =
    fileURLToPath(
        import.meta.url
    );

const __dirname =
    path.dirname(
        __filename
    );


export const dbDirectory =
    app.isPackaged
        ? path.join(
            app.getPath(
                "userData"
            ),
            "data"
        )
        : path.join(
            __dirname,
            "../../database"
        );


fs.mkdirSync(
    dbDirectory,
    {
        recursive: true
    }
);


export const dbPath =
    path.join(
        dbDirectory,
        "kiosko.db"
    );


const db =
    new Database(
        dbPath
    );


db.pragma(
    "foreign_keys = ON"
);

db.pragma(
    "journal_mode = WAL"
);

db.pragma(
    "synchronous = NORMAL"
);


createSchema(
    db
);

runMigrations(
    db
);


export default db;