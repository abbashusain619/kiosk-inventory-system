export const prerender = false;
import type { APIRoute } from 'astro';
import { db, rawDb } from '../../db';
import { adminUser } from '../../db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';

export const POST: APIRoute = async ({ request, cookies }) => {
  const formData = await request.formData();
  const email = formData.get('email')?.toString();
  const password = formData.get('password')?.toString();

  if (!email || !password) {
    return new Response('Email and password required', { status: 400 });
  }

  const user = await db.select().from(adminUser).where(eq(adminUser.email, email)).get();
  if (!user) {
    return new Response('Invalid credentials', { status: 400 });
  }

  const valid = bcrypt.compareSync(password, user.hashedPassword);
  if (!valid) {
    return new Response('Invalid credentials', { status: 400 });
  }

  const sessionId = randomBytes(32).toString('hex');
  const expiresAt = Date.now() + 1000 * 60 * 60 * 24;
  rawDb.prepare(`INSERT INTO user_session (id, user_id, expires_at) VALUES (?, ?, ?)`).run(sessionId, user.id, expiresAt);

  cookies.set('session', sessionId, { path: '/', httpOnly: true, sameSite: 'lax', expires: new Date(expiresAt) });

  console.log('Login: session created', sessionId, 'expires', new Date(expiresAt));
console.log('Cookie set:', cookies.get('session'));

  return new Response(null, { status: 302, headers: { Location: '/admin/dashboard' } });
};