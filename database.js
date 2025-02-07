// database.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Definir la carpeta para la base de datos
const dbDir = path.join(__dirname, 'db');

// Crear la carpeta "db" si no existe
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir);
  console.log('✅ Carpeta "db" creada para almacenar la base de datos.');
}

// Ruta completa para la base de datos
const dbPath = path.join(dbDir, 'users.db');
console.log("Ruta de la base de datos:", dbPath);

// Abrir (o crear) la base de datos con banderas de lectura/escritura y creación
const db = new sqlite3.Database(
  dbPath,
  sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE,
  (err) => {
    if (err) {
      console.error("Error al conectar con la base de datos:", err.message);
    } else {
      console.log("Conexión a la base de datos establecida correctamente.");
    }
  }
);

// Crear la tabla "users" si no existe
db.serialize(() => {
  db.run(
    `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      email TEXT UNIQUE,
      password TEXT
    )`,
    (err) => {
      if (err) {
        console.error("Error al crear la tabla 'users':", err.message);
      } else {
        console.log("Tabla 'users' creada o verificada correctamente.");
      }
    }
  );
});

module.exports = db;
