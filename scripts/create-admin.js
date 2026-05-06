import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';

const db = new Database('./data/kiosk.db');
const email = 'admin@kiosk.com';
const password = 'admin123';
const hashed = bcrypt.hashSync(password, 10);

try {
  // Use snake_case column name as it exists in SQL
  const stmt = db.prepare(`INSERT INTO admin_user (email, hashed_password) VALUES (?, ?)`);
  stmt.run(email, hashed);
  console.log('Admin user created: admin@kiosk.com / admin123');
} catch (e) {
  console.log('Error:', e.message);
}