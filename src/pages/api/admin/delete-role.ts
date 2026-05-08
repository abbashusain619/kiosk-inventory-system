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
  if (!id) throw new ValidationError('Role ID required');

  // Get role details before deletion for audit
  const role = rawDb.prepare('SELECT id, name, description FROM roles WHERE id = ?').get(id) as any;
  if (!role) throw new ValidationError('Role not found');

  // Check if any user has this role
  const used = rawDb.prepare('SELECT COUNT(*) as count FROM admin_user WHERE role_id = ?').get(id) as { count: number };
  if (used.count > 0) {
    throw new ValidationError('Cannot delete: role is assigned to users');
  }
  rawDb.prepare('DELETE FROM role_permissions WHERE role_id = ?').run(id);
  rawDb.prepare('DELETE FROM roles WHERE id = ?').run(id);

  // Audit log
  if (locals.user?.id) {
    await logAudit(locals.user.id, 'DELETE', 'roles', id, role, null);
  }

  return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
};