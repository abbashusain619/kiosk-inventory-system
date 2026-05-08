export const prerender = false;
import type { APIRoute } from 'astro';
import { rawDb } from '../../../db';
import { UnauthorizedError, ValidationError } from '../../../lib/errors';
import bcrypt from 'bcryptjs';
import { logAudit } from '../../../lib/audit';

export const POST: APIRoute = async ({ request, locals }) => {
  if (!locals.permissions?.includes('users.manage')) {
    throw new ValidationError('You do not have permission to manage users');
  }

  const formData = await request.formData();
  const email = formData.get('email')?.toString();
  const password = formData.get('password')?.toString();
  const roleId = Number(formData.get('roleId'));

  if (!email || !password || isNaN(roleId)) {
    throw new ValidationError('Email, password, and role are required');
  }

  // Check if email already exists
  const existing = rawDb.prepare('SELECT id FROM admin_user WHERE email = ?').get(email);
  if (existing) {
    throw new ValidationError('Email already exists');
  }

  const hashed = bcrypt.hashSync(password, 10);
  const stmt = rawDb.prepare('INSERT INTO admin_user (email, hashed_password, role_id) VALUES (?, ?, ?)');
  const result = stmt.run(email, hashed, roleId);
  const newUserId = Number(result.lastInsertRowid);

  // Audit log
  if (locals.user?.id) {
    await logAudit(locals.user.id, 'CREATE', 'admin_user', newUserId, null, { email, roleId });
  }

  return new Response(JSON.stringify({ id: newUserId, email, roleId }), {
    headers: { 'Content-Type': 'application/json' },
  });
};