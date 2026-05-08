import bcrypt from 'bcryptjs';
import Database from 'better-sqlite3';

const db = new Database('./data/kiosk.db');

// Manager
const managerEmail = 'manager@kiosk.com';
const managerPass = 'manager123';
const managerHash = bcrypt.hashSync(managerPass, 10);
try {
  db.prepare('INSERT INTO admin_user (email, hashed_password, role_id) VALUES (?, ?, ?)').run(managerEmail, managerHash, 2);
  console.log('Manager created: manager@kiosk.com / manager123');
} catch(e) {
  console.log('Manager error:', e.message);
}

// Cashier
const cashierEmail = 'cashier@kiosk.com';
const cashierPass = 'cashier123';
const cashierHash = bcrypt.hashSync(cashierPass, 10);
try {
  db.prepare('INSERT INTO admin_user (email, hashed_password, role_id) VALUES (?, ?, ?)').run(cashierEmail, cashierHash, 3);
  console.log('Cashier created: cashier@kiosk.com / cashier123');
} catch(e) {
  console.log('Cashier error:', e.message);
}