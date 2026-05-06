import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema';

const sqlite = new Database('./data/kiosk.db');
export const db = drizzle(sqlite, { schema });
export const rawDb = sqlite;   // <-- add this