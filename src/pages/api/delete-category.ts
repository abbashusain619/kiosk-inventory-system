export const prerender = false;
import type { APIRoute } from 'astro';
import { rawDb } from '../../db';
import { broadcastEvent } from '../../lib/sse';
import { ValidationError } from '../../lib/errors';

export const POST: APIRoute = async ({ request, redirect, locals }) => {
  if (!locals.permissions?.includes('categories.edit')) {
    throw new ValidationError('You do not have permission to delete categories');
  }
  const formData = await request.formData();
  const id = Number(formData.get('id'));
  
  const used = rawDb.prepare('SELECT COUNT(*) as count FROM products WHERE category_id = ?').get(id) as { count: number };
  if (used.count > 0) {
    return redirect('/admin/categories?error=used');
  }
  
  rawDb.prepare('DELETE FROM categories WHERE id = ?').run(id);
  broadcastEvent({ type: 'category-deleted', categoryId: id });
  return redirect('/admin/categories?deleted=1');
};