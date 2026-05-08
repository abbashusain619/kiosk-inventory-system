import Database from 'better-sqlite3';
const db = new Database('./data/kiosk.db');

// Insert permissions
const perms = [
  ['products.view', 'View product list'],
  ['products.edit', 'Create/edit/delete products'],
  ['products.restore', 'Restore soft‑deleted products'],
  ['categories.view', 'View categories'],
  ['categories.edit', 'Add/edit/delete categories'],
  ['suppliers.view', 'View suppliers'],
  ['suppliers.edit', 'Add/edit/delete suppliers'],
  ['stock.view', 'View stock movements'],
  ['stock.in', 'Record purchases (stock in)'],
  ['stock.adjust', 'Record adjustments'],
  ['sales.create', 'Process sales (quick sale & multi‑product)'],
  ['sales.view', 'View sales history'],
  ['reports.profit', 'View profit report'],
  ['users.view', 'View staff list'],
  ['users.manage', 'Add/edit/delete staff and assign roles'],
  ['roles.view', 'View roles'],
  ['roles.manage', 'Manage roles and permissions'],
  ['settings.view', 'View business settings'],
  ['settings.edit', 'Edit business settings'],
  ['backup.download', 'Download database backup'],
];

const insPerm = db.prepare('INSERT OR IGNORE INTO permissions (name, description) VALUES (?, ?)');
for (const [name, desc] of perms) insPerm.run(name, desc);

// Insert roles
const roles = [
  ['super_admin', 'Full access to everything'],
  ['manager', 'Most permissions except user/role management'],
  ['cashier', 'Only sales and view products'],
];

const insRole = db.prepare('INSERT OR IGNORE INTO roles (name, description) VALUES (?, ?)');
for (const [name, desc] of roles) insRole.run(name, desc);

// Get role ids (they will be 1,2,3 if inserted)
const roleIds = { super_admin: 1, manager: 2, cashier: 3 };

// Get permission ids
const permIds = {};
const allPerms = db.prepare('SELECT id, name FROM permissions').all();
for (const p of allPerms) permIds[p.name] = p.id;

function assign(roleName, permNames) {
  const roleId = roleIds[roleName];
  for (const permName of permNames) {
    const permId = permIds[permName];
    if (permId) {
      db.prepare('INSERT OR IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)').run(roleId, permId);
    }
  }
}

assign('super_admin', perms.map(p => p[0])); // all permissions
assign('manager', [
  'products.view', 'products.edit', 'products.restore',
  'categories.view', 'categories.edit',
  'suppliers.view', 'suppliers.edit',
  'stock.view', 'stock.in', 'stock.adjust',
  'sales.create', 'sales.view', 'reports.profit',
  'settings.view', 'settings.edit',
  'backup.download',
]);
assign('cashier', ['products.view', 'sales.create']);

// Update existing admin users to role_id = 1 (super_admin)
db.prepare('UPDATE admin_user SET role_id = 1 WHERE role_id IS NULL').run();

console.log('RBAC data seeded.');