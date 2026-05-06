export const prerender = false;
import type { APIRoute } from 'astro';
import { db, rawDb } from '../../db';
import { products, categories } from '../../db/schema';
import { desc, eq } from 'drizzle-orm';

export const GET: APIRoute = async () => {
  const allProducts = await db.select().from(products).where(eq(products.active, true)).orderBy(desc(products.id));
  const catList = await db.select().from(categories).orderBy(categories.name);
  const settingsRows = rawDb.prepare('SELECT key, value FROM site_settings').all() as { key: string; value: string }[];
  const settings = Object.fromEntries(settingsRows.map(s => [s.key, s.value]));

  return new Response(JSON.stringify({ products: allProducts, categories: catList, settings }), {
    headers: { 'Content-Type': 'application/json' },
  });
};