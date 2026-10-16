// کوئری‌های مشترک خریدار — منطق تازگی نسخه ۲ اینجا متمرکز است (بخش ۵.۲ و ۸.۶)

import prisma from './prisma';
import { expandQuery } from './fa';
import { freshnessOf } from './freshness';

export type OfferView = {
  id: number;
  price: number;
  availability: string;
  note: string | null;
  lastConfirmedAt: Date;
  freshness: 'fresh' | 'aging' | 'stale';
  store: { id: number; name: string; slug: string; phone: string; lat: number | null; lng: number | null; address: string; city: string };
};

export type ProductResult = {
  id: number;
  name: string;
  slug: string;
  imageUrl: string | null;
  brandName: string | null;
  categoryName: string;
  offers: OfferView[];
};

/** تبدیل رکوردهای خام به نمایش: حذف stale از مقایسه + مرتب‌سازی (تازه اول، بعد ارزان) */
export function toProductView(p: {
  id: number; name: string; slug: string; imageUrl: string | null;
  brand?: { name: string } | null;
  category: { name: string };
  offers: Array<{ id: number; price: number; availability: string; note: string | null; lastConfirmedAt: Date; store: { id: number; name: string; slug: string; phone: string; lat: number | null; lng: number | null; address: string; city: string } }>;
}): ProductResult {
  const offers: OfferView[] = p.offers.map(o => ({
    id: o.id,
    price: o.price,
    availability: o.availability,
    note: o.note,
    lastConfirmedAt: o.lastConfirmedAt,
    freshness: freshnessOf(o.lastConfirmedAt),
    store: o.store,
  }));
  offers.sort((a, b) => {
    const stale = (a.freshness === 'stale' ? 1 : 0) - (b.freshness === 'stale' ? 1 : 0);
    if (stale !== 0) return stale;
    return a.price - b.price;
  });
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    imageUrl: p.imageUrl,
    brandName: p.brand?.name ?? null,
    categoryName: p.category.name,
    offers,
  };
}

/** کمترین قیمت فعال + تعداد فروشگاه (کارت‌ها) */
export function cardStats(o: OfferView[]): { minPrice: number | null; storeCount: number; freshness: 'fresh' | 'aging' | 'stale' } {
  const active = o.filter(x => x.freshness !== 'stale');
  return {
    minPrice: active.length ? Math.min(...active.map(x => x.price)) : null,
    storeCount: active.length,
    freshness: active.some(x => x.freshness === 'fresh') ? 'fresh' : active.length ? 'aging' : 'stale',
  };
}

const offerInclude = {
  offers: {
    where: { store: { status: 'ACTIVE' as const } },
    include: { store: { select: { id: true, name: true, slug: true, phone: true, lat: true, lng: true, address: true, city: true } } },
    orderBy: { price: 'asc' as const },
  },
  brand: { select: { name: true } },
  category: { select: { name: true } },
};

/** جستجوی کالا با نرمال‌سازی/مترادف (بخش ۸.۵) */
export async function searchProducts(
  q: string,
  opts: { city?: string; inStockOnly?: boolean } = {},
): Promise<ProductResult[]> {
  const terms = expandQuery(q);
  if (terms.length === 0) return [];
  const products = await prisma.product.findMany({
    where: {
      status: 'ACTIVE',
      OR: terms.flatMap(t => [
        { normalizedName: { contains: t } },
        { brand: { name: { contains: t } } },
      ]),
    },
    include: offerInclude,
    take: 60,
  });
  let results = products.map(toProductView);
  if (opts.city) results = results.map(r => ({ ...r, offers: r.offers.filter(o => o.store.city === opts.city) }));
  if (opts.inStockOnly) results = results.map(r => ({ ...r, offers: r.offers.filter(o => o.availability === 'IN_STOCK') }));
  return results.filter(r => r.offers.length > 0);
}

/** کالاهای یک دسته (با زیردسته‌ها) */
export async function productsOfCategory(
  categoryId: number,
  childIds: number[],
  opts: { city?: string; inStockOnly?: boolean } = {},
): Promise<ProductResult[]> {
  const products = await prisma.product.findMany({
    where: { status: 'ACTIVE', categoryId: { in: [categoryId, ...childIds] } },
    include: offerInclude,
    take: 60,
  });
  let results = products.map(toProductView);
  if (opts.city) results = results.map(r => ({ ...r, offers: r.offers.filter(o => o.store.city === opts.city) }));
  if (opts.inStockOnly) results = results.map(r => ({ ...r, offers: r.offers.filter(o => o.availability === 'IN_STOCK') }));
  return results.filter(r => r.offers.length > 0);
}

/** کالاهای پرکالا (بیشترین فروشگاه) برای صفحه اول */
export async function topProducts(take = 8): Promise<ProductResult[]> {
  const products = await prisma.product.findMany({
    where: { status: 'ACTIVE' },
    include: offerInclude,
    take: 40,
  });
  return products
    .map(toProductView)
    .sort((a, b) => b.offers.filter(o => o.freshness !== 'stale').length - a.offers.filter(o => o.freshness !== 'stale').length)
    .slice(0, take);
}
