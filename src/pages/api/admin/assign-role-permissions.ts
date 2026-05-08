export const prerender = false;
import type { APIRoute } from 'astro';
import { rawDb } from '../../../db';
import { ValidationError } from '../../../lib/errors';

export const POST: APIRoute = async ({ request, locals }) => {
  if (!locals.permissions?.includes('roles.manage')) {
    throw new ValidationError('Permission denied');
  }
  const formData = await request.formData();
  const roleId = Number(formData.get('roleId'));
  const permissionIds = (formData.get('permissionIds')?.toString() || '').split(',').filter(x => x).map(Number);

  if (!roleId) throw new ValidationError('Role ID required');

  // Delete existing
  rawDb.prepare('DELETE FROM role_permissions WHERE role_id = ?').run(roleId);
  // Insert new
  const insert = rawDb.prepare('INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)');
  for (const permId of permissionIds) {
    insert.run(roleId, permId);
  }
  return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
};