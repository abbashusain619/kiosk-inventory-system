export const prerender = false;
import type { APIRoute } from 'astro';
import { rawDb } from '../../db';
import { ValidationError } from '../../lib/errors';

export const POST: APIRoute = async ({ request, redirect, locals }) => {
  if (!locals.permissions?.includes('suppliers.edit')) {
    throw new ValidationError('You do not have permission to delete suppliers');
  }
  const formData = await request.formData();
  const id = Number(formData.get('id'));

  const used = rawDb.prepare('SELECT COUNT(*) as count FROM stock_movements WHERE supplier_id = ?').get(id) as { count: number };
  if (used.count > 0) {
    return redirect('/admin/suppliers?error=used');
  }

  rawDb.prepare('DELETE FROM suppliers WHERE id = ?').run(id);
  return redirect('/admin/suppliers?deleted=1');
};