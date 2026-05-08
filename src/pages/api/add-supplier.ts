export const prerender = false;
import type { APIRoute } from 'astro';
import { rawDb } from '../../db';
import { ValidationError } from '../../lib/errors';
import { logAudit } from '../../lib/audit';

export const POST: APIRoute = async ({ request, redirect, locals }) => {
  if (!locals.permissions?.includes('suppliers.edit')) {
    throw new ValidationError('You do not have permission to add suppliers');
  }
  const formData = await request.formData();
  const name = formData.get('name')?.toString();
  const phone = formData.get('phone')?.toString() || null;
  const email = formData.get('email')?.toString() || null;
  const address = formData.get('address')?.toString() || null;

  if (!name) return new Response('Name required', { status: 400 });

  const stmt = rawDb.prepare('INSERT INTO suppliers (name, phone, email, address) VALUES (?, ?, ?, ?)');
  const result = stmt.run(name, phone, email, address);
  const newId = Number(result.lastInsertRowid);

  // Audit log
  if (locals.user?.id) {
    await logAudit(locals.user.id, 'CREATE', 'suppliers', newId, null, { name, phone, email, address });
  }

  return redirect('/admin/suppliers?added=1');
};