// صفحه اول بازارمه (بخش ۸.۲-۱): جستجو، دسته‌ها، پرفروش‌ها، فروشگاه‌های تازه

import Link from 'next/link';
import prisma from '@/lib/prisma';
import SearchBox from '@/components/SearchBox';
import ProductCard from '@/components/ProductCard';
import { topProducts, cardStats } from '@/lib/queries';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const [categories, top, newStores] = await Promise.all([
    prisma.category.findMany({ where: { parentId: null }, orderBy: { sortOrder: 'asc' } }),
    topProducts(8),
    prisma.store.findMany({ where: { status: 'ACTIVE' }, orderBy: { createdAt: 'desc' }, take: 6 }),
  ]);

  return (
    <div className="flex flex-col gap-10">
      <section className="card bg-gradient-to-l from-brand-50 to-white p-6 sm:p-10">
        <h1 className="mb-2 text-xl font-extrabold text-stone-800 sm:text-2xl">
          قبل از خرید، قیمت‌ها را مقایسه کنید
        </h1>
        <p className="mb-5 text-sm text-stone-500">
          کالای موردنظرتان را جستجو کنید و ببینید کدام فروشگاه‌های شهرستان ماهشهر آن را دارند و با چه قیمتی.
        </p>
        <SearchBox autoFocus />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">دسته‌ها</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {categories.map(c => (
            <Link key={c.id} href={`/category/${c.slug}`} className="card flex flex-col items-center gap-2 p-4 text-center hover:shadow-md">
              <span className="text-3xl" aria-hidden>{c.icon ?? '🛍️'}</span>
              <span className="text-sm font-semibold">{c.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {top.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-bold">کالاهای پرجستجو این روزها</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {top.map(p => {
              const s = cardStats(p.offers);
              return (
                <ProductCard
                  key={p.id}
                  name={p.name}
                  slug={p.slug}
                  imageUrl={p.imageUrl}
                  minPrice={s.minPrice}
                  storeCount={s.storeCount}
                  freshness={s.freshness}
                />
              );
            })}
          </div>
        </section>
      )}

      {newStores.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-bold">فروشگاه‌های تازه‌وارد</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {newStores.map(s => (
              <Link key={s.id} href={`/store/${s.slug}`} className="card p-3 hover:shadow-md">
                <p className="text-sm font-semibold">{s.name}</p>
                <p className="text-xs text-stone-500">{s.categoryName ?? 'فروشگاه'} · {s.city}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="card bg-amber-50 p-4 text-xs leading-6 text-amber-800">
        💡 <strong>قیمت‌ها اطلاع‌رسانی است؛</strong> قیمت قطعی در فروشگاه اعلام می‌شود. اگر قیمتی را اشتباه دیدید،
        همان صفحه با دکمه «این قیمت اشتباه است؟» به ما خبر دهید.
      </section>
    </div>
  );
}
