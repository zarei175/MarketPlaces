// داشبورد فروشنده: ویرایش سریع قیمت + افزودن کالا + آمار سرنخ‌ها (شفافیت — نسخه ۲ اصل ۵)

import Link from 'next/link';
import prisma from '@/lib/prisma';
import { requireStore } from '@/lib/auth';
import { formatNumber, formatToman, timeAgoFa, CITIES } from '@/lib/fa';
import { AVAILABILITY_FA } from '@/lib/freshness';
import {
  vendorUpdateOfferAction, vendorConfirmAllAction, vendorAddOfferAction,
  vendorCreateProductAction, vendorAddStoreItemAction,
} from './actions';

export const dynamic = 'force-dynamic';

export default async function VendorPanel({ searchParams }: { searchParams: { e?: string; ok?: string } }) {
  const session = requireStore();
  if (!session) return null;

  const store = await prisma.store.findUnique({
    where: { id: session.storeId },
    include: {
      offers: { include: { product: { select: { name: true, slug: true } } }, orderBy: { product: { name: 'asc' } } },
      leads: { orderBy: { createdAt: 'desc' }, take: 10 },
    },
  });
  if (!store) return null;

  const [products, stdCategories, brands, customCategories, monthLeads] = await Promise.all([
    prisma.product.findMany({ where: { status: 'ACTIVE' }, select: { id: true, name: true }, orderBy: { name: 'asc' } }),
    prisma.category.findMany({ where: { kind: 'STANDARD' }, orderBy: { parentId: 'asc' } }),
    prisma.brand.findMany({ orderBy: { name: 'asc' } }),
    prisma.category.findMany({ where: { kind: 'CUSTOM' }, orderBy: { name: 'asc' } }),
    prisma.leadEvent.count({ where: { storeId: store.id, createdAt: { gte: new Date(Date.now() - 30 * 86_400_000) } } }),
  ]);

  const TYPE_FA: Record<string, string> = { CALL: 'تماس', DIRECTIONS: 'مسیریابی', VIEW_CONTACT: 'دیدن شماره' };

  return (
    <div className="flex flex-col gap-6">
      <header className="card p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-lg font-extrabold">{store.name}</h1>
          <div className="flex items-center gap-2 text-xs">
            {store.status === 'PENDING'
              ? <span className="badge bg-amber-100 text-amber-700">در انتظار تأیید مدیر — فعلاً در نتایج دیده نمی‌شوید</span>
              : <span className="badge bg-emerald-100 text-emerald-700">فعال</span>}
            <Link href={`/store/${store.slug}`} className="btn-ghost !py-1">صفحه عمومی من ↗</Link>
          </div>
        </div>
        <p className="num mt-2 text-xs text-stone-500">
          سرنخ‌های ۳۰ روز اخیر (تماس/مسیریابی/دیدن شماره): <strong>{formatNumber(monthLeads)}</strong>
        </p>
      </header>

      {searchParams.e && <p className="rounded-lg bg-red-50 p-2 text-xs text-red-600">{searchParams.e}</p>}
      {searchParams.ok && <p className="rounded-lg bg-emerald-50 p-2 text-xs text-emerald-700">
        {searchParams.ok === 'confirmed' ? 'همه قیمت‌ها تأیید شد. ممنون!' : 'ثبت شد.'}
      </p>}

      <section>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-bold">ویرایش سریع قیمت — ۳۰ کالا در ۲ دقیقه</h2>
          <form action={vendorConfirmAllAction}>
            <button className="btn-primary !py-1 text-xs">✅ هیچ قیمتی عوض نشده؛ همه را تأیید می‌کنم</button>
          </form>
        </div>
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[560px] text-right text-sm">
            <thead>
              <tr className="border-b border-stone-200 text-xs text-stone-500">
                <th className="p-2">کالا</th><th className="p-2">قیمت (تومان)</th><th className="p-2">موجودی</th><th className="p-2"></th>
              </tr>
            </thead>
            <tbody>
              {store.offers.map(o => (
                <tr key={o.id} className="border-b border-stone-100 last:border-0">
                  <td className="p-2 text-xs">{o.product.name}</td>
                  <td colSpan={3}>
                    <form action={vendorUpdateOfferAction} className="flex items-center gap-1">
                      <input type="hidden" name="id" value={o.id} />
                      <input name="price" defaultValue={o.price} className="input num !w-32 !py-1 text-xs" />
                      <select name="availability" defaultValue={o.availability} className="input !w-24 !py-1 text-xs">
                        <option value="IN_STOCK">موجود</option>
                        <option value="OUT_OF_STOCK">ناموجود</option>
                        <option value="CALL">تماس</option>
                      </select>
                      <button className="btn-primary !px-2 !py-1 text-xs">ثبت</button>
                      <span className="text-[10px] text-stone-400">{formatToman(o.price)} · {AVAILABILITY_FA[o.availability]}</span>
                    </form>
                  </td>
                </tr>
              ))}
              {store.offers.length === 0 && (
                <tr><td colSpan={4} className="p-4 text-center text-xs text-stone-400">فعلاً کالایی ندارید؛ از پایین اضافه کنید.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        <details className="card p-4 text-sm">
          <summary className="cursor-pointer font-bold">➕ قیمت برای کالای موجود کاتالوگ</summary>
          <form action={vendorAddOfferAction} className="mt-3 flex flex-col gap-2">
            <select name="productId" className="input" required>
              <option value="">— کالا را انتخاب کنید —</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <input name="price" type="number" className="input num" placeholder="قیمت (تومان)" required />
            <select name="availability" className="input">
              <option value="IN_STOCK">موجود</option><option value="OUT_OF_STOCK">ناموجود</option><option value="CALL">تماس بگیرید</option>
            </select>
            <button className="btn-primary">ثبت</button>
          </form>
        </details>

        <details className="card p-4 text-sm">
          <summary className="cursor-pointer font-bold">➕ کالای جدید + قیمت</summary>
          <form action={vendorCreateProductAction} className="mt-3 flex flex-col gap-2">
            <input name="name" className="input" placeholder="نام دقیق کالا" required />
            <select name="categoryId" className="input" required>
              {stdCategories.map(c => <option key={c.id} value={c.id}>{c.parentId ? '— ' : ''}{c.name}</option>)}
            </select>
            <select name="brandId" className="input">
              <option value="">— برند —</option>
              {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            <input name="price" type="number" className="input num" placeholder="قیمت (تومان)" required />
            <button className="btn-primary">ثبت</button>
          </form>
        </details>

        <details className="card p-4 text-sm">
          <summary className="cursor-pointer font-bold">➕ محصول تولیدی (مبل، کابینت…)</summary>
          <form action={vendorAddStoreItemAction} className="mt-3 flex flex-col gap-2">
            <input name="name" className="input" placeholder="مثلاً مبل راحتی ۷ نفره" required />
            <select name="categoryId" className="input" required>
              {customCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <input name="price" type="number" className="input num" placeholder="قیمت (تومان)" required />
            <select name="availability" className="input">
              <option value="IN_STOCK">موجود</option><option value="OUT_OF_STOCK">ناموجود</option>
            </select>
            <button className="btn-primary">ثبت</button>
          </form>
        </details>
      </div>

      <section>
        <h2 className="mb-2 text-sm font-bold">سرنخ‌های اخیر (شفافیت کامل)</h2>
        <div className="card p-2 text-xs">
          {store.leads.length === 0 && <p className="p-2 text-stone-400">فعلاً سرنخی ثبت نشده.</p>}
          {store.leads.map(l => (
            <p key={l.id} className="flex items-center justify-between border-b border-stone-100 p-2 last:border-0">
              <span>{TYPE_FA[l.type]}</span>
              <span className="text-stone-400">{new Date(l.createdAt).toLocaleString('fa-IR')}</span>
            </p>
          ))}
        </div>
      </section>
    </div>
  );
}
