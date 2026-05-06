import { defineMiddleware } from 'astro:middleware';
import { rawDb } from './db';

export const onRequest = defineMiddleware(async (context, next) => {
  const url = new URL(context.request.url);
  console.log('Middleware - path:', url.pathname);
  
  if (url.pathname.startsWith('/admin') && !url.pathname.includes('/login')) {
    const sessionId = context.cookies.get('session')?.value;
    console.log('Middleware - session cookie:', sessionId);
    
    if (!sessionId) {
      console.log('Middleware - no session, redirect to login');
      return context.redirect('/admin/login');
    }
    
    const session = rawDb
      .prepare(`SELECT * FROM user_session WHERE id = ? AND expires_at > ?`)
      .get(sessionId, Date.now()) as { user_id: number } | undefined;
    
    console.log('Middleware - session query result:', session);
    
    if (!session) {
      console.log('Middleware - invalid session, delete and redirect');
      context.cookies.delete('session', { path: '/' });
      return context.redirect('/admin/login');
    }
    context.locals.userId = session.user_id;
    console.log('Middleware - user authorized, userId:', session.user_id);
  }
  return next();
});