export const prerender = false;
import type { APIRoute } from 'astro';
import { rawDb } from '../../db';
import { broadcastEvent } from '../../lib/sse';
import { ValidationError } from '../../lib/errors';

export const POST: APIRoute = async ({ request, redirect, locals }) => {
  if (!locals.permissions?.includes('categories.edit')) {
    throw new ValidationError('You do not have permission to edit categories');
  }
  const formData = await request.formData();
  const name = formData.get('name')?.toString();
  if (!name) return new Response('Name required', { status: 400 });

  const stmt = rawDb.prepare('INSERT INTO categories (name) VALUES (?)');
  const info = stmt.run(name);
  broadcastEvent({ type: 'category-created', category: { id: info.lastInsertRowid, name } });
  return redirect('/admin/categories?added=1');
};