import { rawDb } from '../db';
import {
  ProductSchema,
  SupplierSchema,
  CategorySchema,
  SaleBasketSchema,
  SaleItemSchema,
  StockMovementSchema,
} from './validation';
import { ValidationError } from '../lib/errors';
import { ZodError } from 'zod';

type TableName =
  | 'products'
  | 'suppliers'
  | 'categories'
  | 'sale_baskets'
  | 'sale_items'
  | 'stock_movements';

function sanitizeForSQLite(value: any): any {
  if (typeof value === 'boolean') return value ? 1 : 0;
  if (value === undefined) return null;
  return value;
}

function validateAndClean(table: TableName, data: any): any {
  try {
    let parsed;
    switch (table) {
      case 'products':
        parsed = ProductSchema.parse(data);
        break;
      case 'suppliers':
        parsed = SupplierSchema.parse(data);
        break;
      case 'categories':
        parsed = CategorySchema.parse(data);
        break;
      case 'sale_baskets':
        parsed = SaleBasketSchema.parse(data);
        break;
      case 'sale_items':
        parsed = SaleItemSchema.parse(data);
        break;
      case 'stock_movements':
        parsed = StockMovementSchema.parse(data);
        break;
      default:
        throw new Error(`Unknown table: ${table}`);
    }
    return Object.fromEntries(
      Object.entries(parsed).map(([k, v]) => [k, sanitizeForSQLite(v)])
    );
  } catch (err) {
    if (err instanceof ZodError) {
      const messages = err.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      throw new ValidationError(`Invalid data: ${messages}`);
    }
    throw err;
  }
}

export async function save(table: TableName, data: any): Promise<any> {
  const clean = validateAndClean(table, data);
  const { id, ...rest } = clean;
  if (!id) {
    // Insert
    const keys = Object.keys(rest);
    const placeholders = keys.map(() => '?').join(',');
    const values = Object.values(rest);
    const stmt = rawDb.prepare(`INSERT INTO ${table} (${keys.join(',')}) VALUES (${placeholders})`);
    const info = stmt.run(...values);
    return { ...rest, id: info.lastInsertRowid };
  } else {
    // Update
    const setClause = Object.keys(rest).map(k => `${k} = ?`).join(',');
    const values = [...Object.values(rest), id];
    const stmt = rawDb.prepare(`UPDATE ${table} SET ${setClause} WHERE id = ?`);
    stmt.run(...values);
    return { ...rest, id };
  }
}

export async function find(table: TableName, where?: { key: string; value: any }[]): Promise<any[]> {
  let sql = `SELECT * FROM ${table}`;
  if (where && where.length) {
    const conditions = where.map(w => `${w.key} = ?`).join(' AND ');
    sql += ` WHERE ${conditions}`;
    const values = where.map(w => w.value);
    return rawDb.prepare(sql).all(...values);
  }
  return rawDb.prepare(sql).all();
}

export async function findById(table: TableName, id: number): Promise<any> {
  return rawDb.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(id);
}

export async function deleteRecord(table: TableName, id: number): Promise<boolean> {
  if (table === 'products') {
    // soft delete
    const stmt = rawDb.prepare(`UPDATE products SET active = 0 WHERE id = ?`);
    stmt.run(id);
    return true;
  } else {
    const stmt = rawDb.prepare(`DELETE FROM ${table} WHERE id = ?`);
    stmt.run(id);
    return true;
  }
}