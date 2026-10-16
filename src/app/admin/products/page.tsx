// مدیریت کاتالوگ مرکزی: فهرست + ایجاد کالای جدید + حذف

import Link from 'next/link';
import prisma from '@/lib/prisma';
import { formatNumber } from '@/lib/fa';
import { createProductAction, deleteProductAction } from '../actions';

export const dynamic = 'force-dynamic';

export default async function AdminProductsPage({ searchParams }: { searchParams: { e?: string; ok?: string; q?: string } }) {
  const q = (searchParams.q ?? '').trim();
  const where = q
    ? { OR: [{ normalizedName: { contains: q } }, { name: { contains: q } }] }
    : {};
  const [products, categories, brands] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { category: true, brand: true, _count: { select: { offers: true } } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    }),
    prisma.category.findMany({ orderBy: { parentId: 'asc' } }),
    prisma.brand.findMany({ orderBy: { name: 'asc' } }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-lg font-extrabold">کالاها <span className="num text-sm font-normal text-stone-400">({formatNumber(products.length)})</span></h1>
        <form method="get" className="flex gap-1">
          <input name="q" defaultValue={q} className="input !py-1 text-sm" placeholder="جستجو در کاتالوگ…" />
          <button className="btn-ghost !py-1">جستجو</button>
        </form>
      </div>
      {searchParams.e && <p className="rounded-lg bg-red-50 p-2 text-xs text-red-600">{searchParams.e}</p>}
      {searchParams.ok && <p className="rounded-lg bg-emerald-50 p-2 text-xs text-emerald-700">کالا ساخته شد؛ حالا از صفحه «قیمت‌ها» برایش قیمت بگذارید.</p>}

      <details className="card p-4" open={searchParams.ok === undefined && products.length === 0}>
        <summary className="cursor-pointer text-sm font-bold">➕ کالای جدید (کاتالوگ مرکزی)</summary>
        <form action={createProductAction} className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <div className="col-span-2"><label className="label">نام دقیق کالا *</label><input name="name" className="input" placeholder="کولر گازی جنرال ۲۴ هزار اینورتر" required /></div>
          <div><label className="label">دسته *</label>
            <select name="categoryId" className="input" required>
              {categories.filter(c => c.kind === 'STANDARD').map(c => (
                <option key={c.id} value={c.id}>{c.parentId ? '— ' : ''}{c.name}</option>
              ))}
            </select>
          </div>
          <div><label className="label">برند</label>
            <select name="brandId" className="input">
              <option value="">— بدون برند —</option>
              {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <div className="col-span-2 flex items-end"><button className="btn-primary">ثبت کالا</button></div>
        </form>
        <p className="mt-2 text-[11px] text-stone-400">قبل از ساخت، همان کالا را جستجو کنید تا کالای تکراری نسازیم (نسخه ۲ بخش ۸.۳).</p>
      </details>

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[560px] text-right text-sm">
          <thead>
            <tr className="border-b border-stone-200 text-xs text-stone-500">
              <th className="p-2">نام</th><th className="p-2">دسته</th><th className="p-2">برند</th><th className="p-2">قیمت‌ها</th><th className="p-2"></th>
            </tr>
          </thead>
          <tbody>
            {products.map(p => (
              <tr key={p.id} className="border-b border-stone-100 last:border-0">
                <td className="p-2"><Link href={`/product/${p.slug}`} className="font-medium hover:text-brand-600">{p.name}</Link></td>
                <td className="p-2 text-xs">{p.category.name}</td>
                <td className="p-2 text-xs">{p.brand?.name ?? '—'}</td>
                <td className="num p-2 text-xs">{formatNumber(p._count.offers)}</td>
                <td className="p-2">
                  <form action={deleteProductAction}>
                    <input type="hidden" name="id" value={p.id} />
                    <button className="btn !px-2 !py-1 text-[11px] text-red-500 hover:bg-red-50">حذف</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
