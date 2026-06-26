const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'sistema.db');

let db = null;

async function getDB() {
  if (db) return db;

  const SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  // Create tables
  db.run(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      alias TEXT UNIQUE NOT NULL,
      saldo REAL DEFAULT 0,
      credencial TEXT UNIQUE,
      vencimiento_credencial TEXT,
      creado_en TEXT DEFAULT (datetime('now'))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS transferencias (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      alias_origen TEXT NOT NULL,
      alias_destino TEXT NOT NULL,
      monto REAL NOT NULL,
      estado TEXT NOT NULL,
      mensaje TEXT,
      fecha TEXT DEFAULT (datetime('now'))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS accesos_gimnasio (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      credencial TEXT NOT NULL,
      estado TEXT NOT NULL,
      mensaje TEXT,
      fecha TEXT DEFAULT (datetime('now'))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS cola_avisos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      correo TEXT NOT NULL,
      posicion_actual INTEGER NOT NULL,
      posicion_anterior INTEGER,
      estado TEXT DEFAULT 'esperando',
      fecha TEXT DEFAULT (datetime('now'))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS log_avisos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      correo TEXT NOT NULL,
      mensaje TEXT,
      fecha TEXT DEFAULT (datetime('now'))
    )
  `);

  // Seed demo users if empty
  const check = db.exec("SELECT COUNT(*) as cnt FROM usuarios");
  const cnt = check[0]?.values[0][0] || 0;

  if (cnt === 0) {
    db.run(`INSERT INTO usuarios (nombre, alias, saldo, credencial, vencimiento_credencial) VALUES
      ('Ana García', 'ana123', 5000, 'CRED-001', '2027-12-31'),
      ('Carlos Ruiz', 'carlos99', 3000, 'CRED-002', '2024-01-01'),
      ('Marta López', 'marta_lp', 8000, 'CRED-003', '2027-06-30'),
      ('Juan Pérez', 'juanp', 1500, 'CRED-004', '2027-09-15')`);
  }

  saveDB();
  return db;
}

function saveDB() {
  if (!db) return;
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

function queryAll(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

function queryOne(sql, params = []) {
  const rows = queryAll(sql, params);
  return rows[0] || null;
}

function run(sql, params = []) {
  db.run(sql, params);
  saveDB();
}

module.exports = { getDB, queryAll, queryOne, run, saveDB };
