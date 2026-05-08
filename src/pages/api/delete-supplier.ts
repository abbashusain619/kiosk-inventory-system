export const prerender = false;
import type { APIRoute } from 'astro';
import { rawDb } from '../../db';
import { ValidationError } from '../../lib/errors';
import { logAudit } from '../../lib/audit';

export const POST: APIRoute = async ({ request, redirect, locals }) => {
  if (!locals.permissions?.includes('suppliers.edit')) {
    throw new ValidationError('You do not have permission to delete suppliers');
  }
  const formData = await request.formData();
  const id = Number(formData.get('id'));

  // Fetch supplier data before deletion for audit
  const supplier = rawDb.prepare('SELECT id, name, phone, email, address FROM suppliers WHERE id = ?').get(id) as any;
  if (!supplier) throw new ValidationError('Supplier not found');

  // Check if supplier is used in stock_movements OR products
  const usedInMovements = rawDb.prepare('SELECT COUNT(*) as count FROM stock_movements WHERE supplier_id = ?').get(id) as { count: number };
  const usedInProducts = rawDb.prepare('SELECT COUNT(*) as count FROM products WHERE supplier_id = ?').get(id) as { count: number };
  if (usedInMovements.count > 0 || usedInProducts.count > 0) {
    return redirect('/admin/suppliers?error=used');
  }

  rawDb.prepare('DELETE FROM suppliers WHERE id = ?').run(id);

  // Audit log
  if (locals.user?.id) {
    await logAudit(locals.user.id, 'DELETE', 'suppliers', id, supplier, null);
  }

  return redirect('/admin/suppliers?deleted=1');
};