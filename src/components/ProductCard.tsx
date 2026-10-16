// کارت کالا در نتایج جستجو/دسته (طرح نسخه ۲، بخش ۸.۲-۲)

import Link from 'next/link';
import { formatNumber } from '@/lib/fa';

export type ProductCardData = {
  name: string;
  slug: string;
  imageUrl?: string | null;
  minPrice: number | null;
  storeCount: number;
  freshness?: 'fresh' | 'aging' | 'stale';
};

export default function ProductCard(p: ProductCardData) {
  return (
    <Link href={`/product/${p.slug}`} className="card block p-3 transition-shadow hover:shadow-md">
      <div className="mb-2 flex h-28 items-center justify-center rounded-lg bg-stone-100 text-4xl">
        {p.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.imageUrl} alt={p.name} className="h-full w-full rounded-lg object-contain" />
        ) : (
          <span aria-hidden>📦</span>
        )}
      </div>
      <h3 className="mb-1 line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-5 text-stone-800">{p.name}</h3>
      <p className="num text-sm text-brand-600">
        {p.minPrice != null ? `از ${formatNumber(p.minPrice)} تومان` : 'بدون قیمت — تماس بگیرید'}
      </p>
      <p className="num text-xs text-stone-500">{formatNumber(p.storeCount)} فروشگاه</p>
      {p.freshness === 'fresh' && <span className="badge mt-1 bg-emerald-100 text-emerald-700">به‌روز</span>}
    </Link>
  );
}
