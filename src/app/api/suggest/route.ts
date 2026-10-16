// اتوکامپلیت جستجو: کالاها (با کمترین قیمت فعال) + فروشگاه‌ها

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { expandQuery } from '@/lib/fa';
import { freshnessOf } from '@/lib/freshness';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const q = (new URL(req.url).searchParams.get('q') ?? '').trim();
  if (q.length < 2) return NextResponse.json({ products: [], stores: [] });

  const terms = expandQuery(q);
  const products = await prisma.product.findMany({
    where: {
      status: 'ACTIVE',
      OR: terms.flatMap(t => [
        { normalizedName: { contains: t } },
        { brand: { name: { contains: t } } },
      ]),
    },
    include: {
      offers: { where: { store: { status: 'ACTIVE' } }, select: { price: true, lastConfirmedAt: true } },
    },
    take: 6,
  });

  const mapped = products.map(p => {
    const active = p.offers.filter(o => freshnessOf(o.lastConfirmedAt) !== 'stale');
    return {
      name: p.name,
      slug: p.slug,
      minPrice: active.length ? Math.min(...active.map(o => o.price)) : null,
      storeCount: active.length,
    };
  });

  const stores = await prisma.store.findMany({
    where: { status: 'ACTIVE', OR: terms.map(t => ({ name: { contains: t } })) },
    select: { name: true, slug: true },
    take: 4,
  });

  return NextResponse.json({ products: mapped, stores });
}
