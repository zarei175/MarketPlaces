// گزارش خطای قیمت/موجودی از کاربران (کراودسورسینگ — نسخه ۲ بخش ۵.۱ روش ۷)

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const TYPES = new Set(['WRONG_PRICE', 'OUT_OF_STOCK', 'OTHER']);

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || !TYPES.has(body.type)) return NextResponse.json({ ok: false }, { status: 400 });
    if (typeof body.offerId !== 'number' && typeof body.storeItemId !== 'number') {
      return NextResponse.json({ ok: false }, { status: 400 });
    }
    await prisma.issueReport.create({
      data: {
        offerId: typeof body.offerId === 'number' ? body.offerId : null,
        storeItemId: typeof body.storeItemId === 'number' ? body.storeItemId : null,
        type: body.type,
        note: typeof body.note === 'string' ? body.note.slice(0, 500) : null,
      },
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
