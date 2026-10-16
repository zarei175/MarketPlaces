// نتایج جستجو (بخش ۸.۲-۲): فیلتر شهر/موجودی، مرتب‌سازی، + جستجوی تولیدی‌ها

import Link from 'next/link';
import prisma from '@/lib/prisma';
import SearchBox from '@/components/SearchBox';
import ProductCard from '@/components/ProductCard';
import { searchProducts, cardStats } from '@/lib/queries';
import { expandQuery, normalizeFa, formatNumber, formatToman, CITIES } from '@/lib/fa';

export const dynamic = 'force-dynamic';

type SP = { q?: string; city?: string; instock?: string };

export default async function SearchPage({ searchParams }: { searchParams: SP }) {
  const q = (searchParams.q ?? '').trim();
  const city = searchParams.city && CITIES.includes(searchParams.city as never) ? searchParams.city : undefined;
  const inStockOnly = searchParams.instock === '1';

  const results = q ? await searchProducts(q, { city, inStockOnly }) : [];
  const storeItems = q
    ? await prisma.storeItem.findMany({
        where: {
          store: { status: 'ACTIVE' },
          OR: expandQuery(q).map(t => ({ normalizedName: { contains: t } })),
        },
        include: { store: { select: { name: true, slug: true, city: true } } },
        take: 12,
      })
    : [];

  if (q) {
    // ثبت جستجو برای «دیتای تقاضا» (نسخه ۲ بخش ۸.۵) — حتی بی‌نتیجه‌ها
    await prisma.searchLog.create({
      data: { query: q, normalized: normalizeFa(q), resultsCount: results.length + storeItems.length },
    }).catch(() => {});
  }

  return (
    <div className="flex flex-col gap-6">
      <SearchBox />

      <form className="card flex flex-wrap items-end gap-3 p-3 text-sm" method="get">
        <input type="hidden" name="q" value={q} />
        <div>
          <label className="label">شهر</label>
          <select name="city" defaultValue={city ?? ''} className="input">
            <option value="">همه شهرها</option>
            {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <label className="flex items-center gap-1 pb-2">
          <input type="checkbox" name="instock" value="1" defaultChecked={inStockOnly} /> فقط موجودها
        </label>
        <button className="btn-ghost">اعمال فیلتر</button>
      </form>

      {!q && <p className="text-center text-sm text-stone-500">نام کالا را در کادر بالا بنویسید…</p>}

      {q && results.length === 0 && storeItems.length === 0 && (
        <div className="card p-6 text-center text-sm text-stone-500">
          نتیجه‌ای برای «{q}» پیدا نشد.
          <br />
          کالای موردنظرتان در هیچ فروشگاهِ ثبت‌شده‌ای حاضر نیست — این جستجو برای ما ثبت شد تا کاتالوگ را کامل‌تر کنیم.
        </div>
      )}

      {results.length > 0 && (
        <section>
          <p className="num mb-3 text-xs text-stone-500">{formatNumber(results.length)} کالا</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {results.map(p => {
              const s = cardStats(p.offers);
              return (
                <ProductCard key={p.id} name={p.name} slug={p.slug} imageUrl={p.imageUrl} minPrice={s.minPrice} storeCount={s.storeCount} freshness={s.freshness} />
              );
            })}
          </div>
        </section>
      )}

      {storeItems.length > 0 && (
        <section>
          <h2 className="mb-3 text-base font-bold">تولیدی‌ها و دست‌سازها</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {storeItems.map(s => (
              <Link key={s.id} href={`/store/${s.store.slug}`} className="card p-3 hover:shadow-md">
                <p className="mb-1 text-sm font-semibold">{s.name}</p>
                <p className="num text-sm text-brand-600">{formatToman(s.price)}</p>
                <p className="text-xs text-stone-500">{s.store.name} · {s.store.city}</p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
