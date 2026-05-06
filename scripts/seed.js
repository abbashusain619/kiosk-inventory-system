import Database from 'better-sqlite3';
const db = new Database('./data/kiosk.db');

const products = [
  { name: 'Soda', price: 1500, stock: 10 },
  { name: 'Water', price: 1000, stock: 25 },
  { name: 'Chips', price: 2000, stock: 5 },
];

for (const p of products) {
  db.prepare(`INSERT INTO products (name, price, stock) VALUES (?, ?, ?)`).run(p.name, p.price, p.stock);
}
console.log('Seeded products');