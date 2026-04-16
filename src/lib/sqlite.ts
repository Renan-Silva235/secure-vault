import { get, set } from "idb-keyval";
import initSqlJs, { type Database, type SqlJsStatic } from "sql.js";
import sqlWasmUrl from "sql.js/dist/sql-wasm.wasm?url";

const DB_STORAGE_KEY = "secure_vault_sqlite_db";

let SQL: SqlJsStatic | null = null;
let db: Database | null = null;
let initPromise: Promise<Database> | null = null;

async function persistDatabase(database: Database): Promise<void> {
  const bytes = database.export();
  await set(DB_STORAGE_KEY, bytes);
}

function createSchema(database: Database): void {
  database.exec(`
    CREATE TABLE IF NOT EXISTS kv_store (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);
}

async function migrateLegacyLocalStorage(database: Database): Promise<void> {
  const legacyAuth = localStorage.getItem("vault_auth");
  const legacyVault = localStorage.getItem("vault_data");
  const legacyAttempts = localStorage.getItem("vault_attempts");

  if (!legacyAuth && !legacyVault && !legacyAttempts) {
    return;
  }

  database.run("BEGIN TRANSACTION");
  try {
    if (legacyAuth) {
      database.run(
        "INSERT OR REPLACE INTO kv_store (key, value) VALUES (?, ?)",
        ["vault_auth", legacyAuth],
      );
    }
    if (legacyVault) {
      database.run(
        "INSERT OR REPLACE INTO kv_store (key, value) VALUES (?, ?)",
        ["vault_data", legacyVault],
      );
    }
    if (legacyAttempts) {
      database.run(
        "INSERT OR REPLACE INTO kv_store (key, value) VALUES (?, ?)",
        ["vault_attempts", legacyAttempts],
      );
    }
    database.run("COMMIT");

    localStorage.removeItem("vault_auth");
    localStorage.removeItem("vault_data");
    localStorage.removeItem("vault_attempts");

    await persistDatabase(database);
  } catch (error) {
    database.run("ROLLBACK");
    throw error;
  }
}

export async function getDatabase(): Promise<Database> {
  if (db) return db;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      console.log("Inicializando SQLite...");
      SQL = await initSqlJs({ locateFile: () => sqlWasmUrl });
      console.log("sql.js inicializado");

      const existing = await get<Uint8Array>(DB_STORAGE_KEY);
      console.log("Dados existentes no IndexedDB:", !!existing);

      const database = existing
        ? new SQL.Database(existing)
        : new SQL.Database();
      console.log("Database criado");

      createSchema(database);
      console.log("Schema criado");

      await migrateLegacyLocalStorage(database);
      console.log("Migração de dados legacy concluída");

      await persistDatabase(database);
      console.log("Database persistido");

      db = database;
      return database;
    } catch (error) {
      console.error("Erro ao inicializar database:", error);
      throw error;
    }
  })();

  return initPromise;
}

export async function getValue(key: string): Promise<string | null> {
  const database = await getDatabase();
  const result = database.exec("SELECT value FROM kv_store WHERE key = ?", [
    key,
  ]);
  if (!result[0] || result[0].values.length === 0) {
    return null;
  }
  return result[0].values[0][0] as string;
}

export async function setValue(key: string, value: string): Promise<void> {
  const database = await getDatabase();
  database.run("INSERT OR REPLACE INTO kv_store (key, value) VALUES (?, ?)", [
    key,
    value,
  ]);
  await persistDatabase(database);
}

export async function removeValue(key: string): Promise<void> {
  const database = await getDatabase();
  database.run("DELETE FROM kv_store WHERE key = ?", [key]);
  await persistDatabase(database);
}
