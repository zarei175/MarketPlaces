// ورود مدیر/اپراتور — Server Action ساده با نشست کوکی امضاشده

'use server';

import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { verifyPassword, setSession } from '@/lib/auth';

export async function loginAction(formData: FormData) {
  const username = String(formData.get('username') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  if (!username || !password) redirect('/login?e=missing');

  const user = await prisma.adminUser.findUnique({ where: { username } });
  if (!user || !verifyPassword(password, user.passwordHash)) {
    redirect('/login?e=wrong');
  }

  await setSession({ kind: 'admin', id: user.id, username: user.username, role: user.role });
  redirect('/admin');
}
