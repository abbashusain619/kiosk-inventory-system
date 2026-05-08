export const prerender = false;
import type { APIRoute } from 'astro';
import { rawDb } from '../../../db';
import { UnauthorizedError, ValidationError } from '../../../lib/errors';

export const GET: APIRoute = async ({ cookies, locals }) => {
  const sessionId = cookies.get('session')?.value;
  if (!sessionId) throw new UnauthorizedError();
  if (!locals.permissions?.includes('users.manage')) {
    throw new ValidationError('You do not have permission to manage users');
  }

  const users = rawDb.prepare(`
    SELECT u.id, u.email, u.role_id, r.name as role_name
    FROM admin_user u
    LEFT JOIN roles r ON u.role_id = r.id
    ORDER BY u.id
  `).all();

  return new Response(JSON.stringify(users), {
    headers: { 'Content-Type': 'application/json' },
  });
};