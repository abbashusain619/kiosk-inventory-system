export const prerender = false;
import type { APIRoute } from 'astro';
import { rawDb } from '../../../db';
import { UnauthorizedError, ValidationError } from '../../../lib/errors';

export const GET: APIRoute = async ({ cookies, locals }) => {
  const sessionId = cookies.get('session')?.value;
  if (!sessionId) throw new UnauthorizedError();
  if (!locals.permissions?.includes('roles.manage')) {
    throw new ValidationError('Permission denied');
  }

  const roles = rawDb.prepare('SELECT id, name, description FROM roles ORDER BY id').all() as any[];
  for (const role of roles) {
    const perms = rawDb.prepare('SELECT permission_id FROM role_permissions WHERE role_id = ?').all(role.id) as { permission_id: number }[];
    role.permissionIds = perms.map(p => p.permission_id);
  }
  return new Response(JSON.stringify(roles), { headers: { 'Content-Type': 'application/json' } });
};