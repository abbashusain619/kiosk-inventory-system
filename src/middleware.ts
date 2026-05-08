import { defineMiddleware } from 'astro:middleware';
import { rawDb } from './db';
import { getTranslation, getAvailableLanguages } from './lib/i18n';

export const onRequest = defineMiddleware(async (context, next) => {
  const url = new URL(context.request.url);
  const sessionId = context.cookies.get('session')?.value;

  const cookieLang = context.cookies.get('lang')?.value;
  const lang = cookieLang && ['en', 'sw'].includes(cookieLang) ? cookieLang : 'en';
  context.locals.lang = lang;
  context.locals.t = (key: string) => getTranslation(lang, key);

  // Default values
  context.locals.user = undefined;
  context.locals.permissions = [];

  if (sessionId) {
    const session = rawDb.prepare(`
      SELECT s.user_id, u.email, u.role_id, r.name as role_name
      FROM user_session s
      JOIN admin_user u ON s.user_id = u.id
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE s.id = ? AND s.expires_at > ?
    `).get(sessionId, Date.now()) as any;

    if (session) {
      context.locals.user = {
        id: session.user_id,
        email: session.email,
        roleId: session.role_id,
        roleName: session.role_name,
      };

      const perms = rawDb.prepare(`
        SELECT p.name
        FROM role_permissions rp
        JOIN permissions p ON rp.permission_id = p.id
        WHERE rp.role_id = ?
      `).all(session.role_id) as { name: string }[];
      context.locals.permissions = perms.map(p => p.name);
    }
  }

  // Redirect unauthenticated access to admin pages (except login)
  if (url.pathname.startsWith('/admin') && !url.pathname.includes('/login') && !context.locals.user) {
    return context.redirect('/admin/login');
  }

  return next();
});