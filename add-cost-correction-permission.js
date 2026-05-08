import Database from 'better-sqlite3';
const db = new Database('./data/kiosk.db');

// Insert permission
db.prepare('INSERT OR IGNORE INTO permissions (name, description) VALUES (?, ?)')
  .run('stock.cost_correct', 'Adjust product cost price (no stock change)');
console.log('Cost correction permission added');

// Get permission id
const perm = db.prepare('SELECT id FROM permissions WHERE name = ?').get('stock.cost_correct');
if (perm) {
  // Assign to super_admin (role_id=1), manager (role_id=2)
  db.prepare('INSERT OR IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)').run(1, perm.id);
  db.prepare('INSERT OR IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)').run(2, perm.id);
  console.log('Assigned to super_admin and manager');
}