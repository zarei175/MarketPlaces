// ثبت فروشگاه جدید پس از OTP (نسخه ۲ بخش ۸.۳): فرم کوتاه → وضعیت PENDING تا تأیید مدیر

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getPendingMobile, clearPendingMobile, setSession } from '@/lib/auth';
import { normalizeFa, slugifyFa } from '@/lib/fa';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const mobile = getPendingMobile();
  if (!mobile) return NextResponse.json({ ok: false, error: 'اول کد پیامکی را تأیید کنید' }, { status: 401 });

  const b = await req.json().catch(() => null);
  const name = typeof b?.name === 'string' ? b.name.trim() : '';
  const phone = typeof b?.phone === 'string' ? b.phone.trim() : '';
  const address = typeof b?.address === 'string' ? b.address.trim() : '';
  const city = typeof b?.city === 'string' ? b.city : 'بندر ماهشهر';
  const categoryName = typeof b?.categoryName === 'string' ? b.categoryName.trim() : null;
  if (!name || !phone || !address) return NextResponse.json({ ok: false, error: 'نام، تلفن و آدرس الزامی است' }, { status: 400 });

  let slug = slugifyFa(name) || `store-${Date.now()}`;
  if (await prisma.store.findFirst({ where: { slug } })) slug = `${slug}-${Date.now()}`;

  const store = await prisma.store.create({
    data: { name, slug, phone, address, city, categoryName, status: 'PENDING' },
  });
  const user = await prisma.storeUser.create({
    data: { storeId: store.id, mobile, role: 'OWNER' },
  });

  await clearPendingMobile();
  await setSession({ kind: 'store', id: user.id, storeId: store.id, mobile, role: user.role });

  return NextResponse.json({ ok: true });
}
