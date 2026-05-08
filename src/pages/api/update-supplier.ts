export const prerender = false;
import type { APIRoute } from 'astro';
import { rawDb } from '../../db';
import { ValidationError } from '../../lib/errors';
import { logAudit } from '../../lib/audit';

export const POST: APIRoute = async ({ request, redirect, locals }) => {
  if (!locals.permissions?.includes('suppliers.edit')) {
    throw new ValidationError('You do not have permission to edit suppliers');
  }
  const formData = await request.formData();
  const id = Number(formData.get('id'));
  const name = formData.get('name')?.toString();
  const phone = formData.get('phone')?.toString() || null;
  const email = formData.get('email')?.toString() || null;
  const address = formData.get('address')?.toString() || null;

  if (!id || !name) return new Response('Invalid data', { status: 400 });

  // Fetch old supplier data
  const oldSupplier = rawDb.prepare('SELECT id, name, phone, email, address FROM suppliers WHERE id = ?').get(id) as any;
  if (!oldSupplier) throw new ValidationError('Supplier not found');

  rawDb.prepare('UPDATE suppliers SET name = ?, phone = ?, email = ?, address = ? WHERE id = ?')
    .run(name, phone, email, address, id);

  // Audit log
  if (locals.user?.id) {
    const newSupplier = { id, name, phone, email, address };
    await logAudit(locals.user.id, 'UPDATE', 'suppliers', id, oldSupplier, newSupplier);
  }

  return redirect('/admin/suppliers?updated=1');
};