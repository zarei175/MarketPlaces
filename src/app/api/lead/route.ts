// ثبت سرنخ خریدار (تماس/مسیریابی/نمایش شماره) — از روز اول جمع می‌شود (نسخه ۲ بخش ۹.۴ LeadEvent)

import { NextResponse } from 'next/server';
import { createHash } from 'crypto';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const TYPES = new Set(['CALL', 'DIRECTIONS', 'VIEW_CONTACT']);

function ipHash(req: Request): string | null {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    null;
  if (!ip) return null;
  return createHash('sha256').update(`${ip}:${process.env.SESSION_SECRET ?? ''}`).digest('hex').slice(0, 32);
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body.storeId !== 'number' || !TYPES.has(body.type)) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }
    const store = await prisma.store.findUnique({ where: { id: body.storeId }, select: { id: true } });
    if (!store) return NextResponse.json({ ok: false }, { status: 404 });

    await prisma.leadEvent.create({
      data: {
        storeId: body.storeId,
        offerId: typeof body.offerId === 'number' ? body.offerId : null,
        type: body.type,
        ipHash: ipHash(req),
      },
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
