export const prerender = false;
import type { APIRoute } from 'astro';
import { rawDb } from '../../db';
import { broadcastEvent } from '../../lib/sse';

export const POST: APIRoute = async ({ request, redirect }) => {
  const formData = await request.formData();
  const id = Number(formData.get('id'));
  
  // Check if category is used
  const used = rawDb.prepare('SELECT COUNT(*) as count FROM products WHERE category_id = ?').get(id) as { count: number };
  if (used.count > 0) {
    return redirect('/admin/categories?error=used');
  }
  
  rawDb.prepare('DELETE FROM categories WHERE id = ?').run(id);
  broadcastEvent({ type: 'category-deleted', categoryId: id });
  return redirect('/admin/categories?deleted=1');
};