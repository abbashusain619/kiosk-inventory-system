export const prerender = false;
import type { APIRoute } from 'astro';
import { rawDb } from '../../db';

export const POST: APIRoute = async ({ request, redirect }) => {
  const formData = await request.formData();
  const name = formData.get('name')?.toString();
  const phone = formData.get('phone')?.toString() || null;
  const email = formData.get('email')?.toString() || null;
  const address = formData.get('address')?.toString() || null;

  if (!name) return new Response('Name required', { status: 400 });

  rawDb.prepare('INSERT INTO suppliers (name, phone, email, address) VALUES (?, ?, ?, ?)')
    .run(name, phone, email, address);

  return redirect('/admin/suppliers?added=1');
};