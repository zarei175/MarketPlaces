// تأیید OTP فروشنده:
//  - کاربر قبلی → نشست کامل → پنل
//  - موبایل جدید → نشست موقت (pending) → فرم ثبت فروشگاه

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyOtp } from '@/lib/otp';
import { setSession, setPendingMobile } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const mobile = typeof body?.mobile === 'string' ? body.mobile.replace(/[\s-]/g, '') : '';
  const code = typeof body?.code === 'string' ? body.code.trim() : '';
  if (!mobile || !code) return NextResponse.json({ ok: false, error: 'کد و موبایل لازم است' }, { status: 400 });

  const valid = await verifyOtp(mobile, code);
  if (!valid) return NextResponse.json({ ok: false, error: 'کد درست نیست یا منقضی شده' }, { status: 401 });

  const user = await prisma.storeUser.findUnique({
    where: { mobile },
    include: { store: { select: { id: true, status: true } } },
  });

  if (user && user.storeId) {
    await setSession({ kind: 'store', id: user.id, storeId: user.storeId, mobile: user.mobile, role: user.role });
    return NextResponse.json({ ok: true, registered: true });
  }

  await setPendingMobile(mobile);
  return NextResponse.json({ ok: true, registered: false });
}
