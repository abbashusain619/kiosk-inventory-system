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
  const roleId = Number(formData.get('roleId'));
  const permissionIds = (formData.get('permissionIds')?.toString() || '').split(',').filter(x => x).map(Number);

  if (!roleId) throw new ValidationError('Role ID required');

  // Get old permissions for audit
  const oldPerms = rawDb.prepare('SELECT permission_id FROM role_permissions WHERE role_id = ?').all(roleId) as { permission_id: number }[];
  const oldPermIds = oldPerms.map(p => p.permission_id);

  // Delete existing
  rawDb.prepare('DELETE FROM role_permissions WHERE role_id = ?').run(roleId);
  // Insert new
  const insert = rawDb.prepare('INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)');
  for (const permId of permissionIds) {
    insert.run(roleId, permId);
  }

  // Audit log
  if (locals.user?.id) {
    await logAudit(
      locals.user.id,
      'UPDATE_PERMISSIONS',
      'role_permissions',
      roleId,
      { permissionIds: oldPermIds },
      { permissionIds }
    );
  }

  return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
};