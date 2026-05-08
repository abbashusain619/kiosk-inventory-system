import Database from 'better-sqlite3';
const db = new Database('./data/kiosk.db');
db.exec(`
  CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    action TEXT NOT NULL,
    table_name TEXT NOT NULL,
    record_id INTEGER,
    old_data TEXT,
    new_data TEXT,
    created_at INTEGER NOT NULL
  )
`);
console.log('Audit logs table created');