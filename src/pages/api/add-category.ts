export const prerender = false;
import type { APIRoute } from 'astro';
import { rawDb } from '../../db';
import { broadcastEvent } from '../../lib/sse';
import { ValidationError } from '../../lib/errors';
import { logAudit } from '../../lib/audit';

export const POST: APIRoute = async ({ request, redirect, locals }) => {
  if (!locals.permissions?.includes('categories.edit')) {
    throw new ValidationError('You do not have permission to edit categories');
  }
  const formData = await request.formData();
  const name = formData.get('name')?.toString();
  if (!name) return new Response('Name required', { status: 400 });

  const stmt = rawDb.prepare('INSERT INTO categories (name) VALUES (?)');
  const info = stmt.run(name);
  const newCategory = { id: Number(info.lastInsertRowid), name };

  // Audit log
  if (locals.user?.id) {
    await logAudit(locals.user.id, 'CREATE', 'categories', newCategory.id, null, newCategory);
  }

  broadcastEvent({ type: 'category-created', category: newCategory });
  return redirect('/admin/categories?added=1');
};