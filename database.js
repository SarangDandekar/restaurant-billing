const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./restaurant.db');

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS admin (
    id INTEGER PRIMARY KEY,
    username TEXT UNIQUE,
    password TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS menu (
    id INTEGER PRIMARY KEY,
    name TEXT,
    price REAL
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS bills (
    id INTEGER PRIMARY KEY,
    customer_phone TEXT,
    items TEXT,
    total REAL,
    date TEXT
  )`);

  // Insert default admin
  db.run(`INSERT OR IGNORE INTO admin (username, password) VALUES ('admin', 'password')`);

  // Insert sample menu items (commented out as per user request)
  // db.run(`INSERT OR IGNORE INTO menu (name, price) VALUES ('Pizza', 10.99)`);
  // db.run(`INSERT OR IGNORE INTO menu (name, price) VALUES ('Burger', 8.99)`);
  // db.run(`INSERT OR IGNORE INTO menu (name, price) VALUES ('Pasta', 12.99)`);
});

module.exports = db;
