export const prerender = false;
import type { APIRoute } from 'astro';
import { rawDb } from '../../db';
import { ValidationError } from '../../lib/errors';
import { logAudit } from '../../lib/audit';

export const POST: APIRoute = async ({ request, locals }) => {
  if (!locals.permissions?.includes('suppliers.edit')) {
    throw new ValidationError('You do not have permission to add suppliers');
  }

  const formData = await request.formData();
  const name = formData.get('name')?.toString();
  const phone = formData.get('phone')?.toString() || null;

  if (!name) throw new ValidationError('Supplier name required');

  const stmt = rawDb.prepare('INSERT INTO suppliers (name, phone) VALUES (?, ?)');
  const result = stmt.run(name, phone);
  const newId = Number(result.lastInsertRowid);
  const newSupplier = { id: newId, name, phone };

  // Audit log
  if (locals.user?.id) {
    await logAudit(locals.user.id, 'CREATE', 'suppliers', newId, null, newSupplier);
  }

  return new Response(JSON.stringify({ id: newId, name }), {
    headers: { 'Content-Type': 'application/json' },
  });
};