export const prerender = false;
import type { APIRoute } from 'astro';
import { rawDb } from '../../../db';
import { ValidationError } from '../../../lib/errors';
import { logAudit } from '../../../lib/audit';

export const POST: APIRoute = async ({ request, locals }) => {
  if (!locals.permissions?.includes('roles.manage')) {
    throw new ValidationError('Permission denied');
  }
  const formData = await request.formData();
  const id = Number(formData.get('id'));
  const name = formData.get('name')?.toString();
  const description = formData.get('description')?.toString() || null;

  if (!id || !name) throw new ValidationError('Invalid data');

  // Fetch old role data before update
  const oldRole = rawDb.prepare('SELECT id, name, description FROM roles WHERE id = ?').get(id) as any;

  rawDb.prepare('UPDATE roles SET name = ?, description = ? WHERE id = ?').run(name, description, id);

  // Audit log
  if (locals.user?.id) {
    const newRole = { id, name, description };
    await logAudit(locals.user.id, 'UPDATE', 'roles', id, oldRole, newRole);
  }

  return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
};