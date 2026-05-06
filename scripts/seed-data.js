import Database from 'better-sqlite3';
const db = new Database('./data/kiosk.db');

// Seed categories
const categories = ['Drinks', 'Snacks', 'Household', 'Phone Credit'];
for (const cat of categories) {
  db.prepare(`INSERT OR IGNORE INTO categories (name) VALUES (?)`).run(cat);
}
console.log('Categories seeded');

// Seed a dummy supplier
db.prepare(`INSERT OR IGNORE INTO suppliers (name, phone) VALUES (?, ?)`).run('Local Wholesale', '0712345678');
console.log('Supplier seeded');