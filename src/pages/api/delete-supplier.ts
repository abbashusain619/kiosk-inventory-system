export const prerender = false;
import type { APIRoute } from 'astro';
import { rawDb } from '../../db';

export const POST: APIRoute = async ({ request, redirect }) => {
  const formData = await request.formData();
  const id = Number(formData.get('id'));

  // Check if supplier is used in any stock movement
  const used = rawDb.prepare('SELECT COUNT(*) as count FROM stock_movements WHERE supplier_id = ?').get(id) as { count: number };
  if (used.count > 0) {
    // Redirect with error message? For now, just redirect with ?error=used
    return redirect('/admin/suppliers?error=used');
  }

  rawDb.prepare('DELETE FROM suppliers WHERE id = ?').run(id);
  return redirect('/admin/suppliers?deleted=1');
};