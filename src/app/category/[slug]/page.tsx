// صفحه دسته (بخش ۸.۲-۲): محصولات استاندارد + تولیدی‌های همان دسته

import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import ProductCard from '@/components/ProductCard';
import { productsOfCategory, cardStats } from '@/lib/queries';
import { formatNumber, formatToman, CITIES } from '@/lib/fa';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

type Params = { slug: string };
type SP = { city?: string; instock?: string };

/** Next ممکن است پارامتر فارسی را raw (percent-encoded) تحویل دهد — decode ایمن */
function decodeSlug(raw: string): string {
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

async function getCategory(rawSlug: string) {
  const slug = decodeSlug(rawSlug);
  const category = await prisma.category.findUnique({
    where: { slug },
    include: { children: true, parent: true },
  });
  return category;
}

export async function generateMetadata({ params }: { params: Params }) {
  const category = await getCategory(params.slug);
  if (!category) return {};
  return {
    title: `قیمت ${category.name} در ماهشهر`,
    description: `مقایسه قیمت ${category.name} بین فروشگاه‌های شهرستان ماهشهر — بازارمه`,
  };
}

export default async function CategoryPage({ params, searchParams }: { params: Params; searchParams: SP }) {
  const category = await getCategory(params.slug);
  if (!category) notFound();

  const city = searchParams.city && CITIES.includes(searchParams.city as never) ? searchParams.city : undefined;
  const inStockOnly = searchParams.instock === '1';
  const results = await productsOfCategory(
    category.id,
    category.children.map(c => c.id),
    { city, inStockOnly },
  );

  const storeItems = category.kind === 'CUSTOM'
    ? await prisma.storeItem.findMany({
        where: {
          categoryId: { in: [category.id, ...category.children.map(c => c.id)] },
          store: { status: 'ACTIVE' },
        },
        include: { store: { select: { name: true, slug: true, city: true } } },
        take: 24,
      })
    : [];

  return (
    <div className="flex flex-col gap-6">
      <header>
        <nav className="mb-1 text-xs text-stone-400">
          <Link href="/">بازارمه</Link>
          {category.parent && <> {' / '} <Link href={`/category/${category.parent.slug}`}>{category.parent.name}</Link></>}
        </nav>
        <h1 className="text-xl font-extrabold text-stone-900">
          {category.icon && <span aria-hidden>{category.icon} </span>}
          {category.name}
        </h1>
      </header>

      <form className="card flex flex-wrap items-end gap-3 p-3 text-sm" method="get">
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

      {results.length === 0 && storeItems.length === 0 && (
        <p className="card p-6 text-center text-sm text-stone-500">فعلاً در این دسته کالایی ثبت نشده است.</p>
      )}
    </div>
  );
}
