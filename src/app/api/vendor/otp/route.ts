// ارسال OTP فروشنده (موبایل → کد پیامکی کاوه‌نگار)

import { NextResponse } from 'next/server';
import { sendOtp } from '@/lib/otp';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const mobile = typeof body?.mobile === 'string' ? body.mobile.replace(/[\s-]/g, '') : '';
  if (!mobile) return NextResponse.json({ ok: false, error: 'موبایل لازم است' }, { status: 400 });

  const r = await sendOtp(mobile);
  return NextResponse.json(r, { status: r.ok ? 200 : 429 });
}
