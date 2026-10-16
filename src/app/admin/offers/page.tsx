// مدیریت قیمت‌ها (Offer): افزودن قیمت به کالا + ویرایش سریع + تأیید + حذف

import Link from 'next/link';
import prisma from '@/lib/prisma';
import { formatToman, timeAgoFa, formatNumber } from '@/lib/fa';
import { freshnessOf, AVAILABILITY_FA } from '@/lib/freshness';
import { upsertOfferAction, quickUpdateOfferAction, confirmOfferAction, deleteOfferAction } from '../actions';

export const dynamic = 'force-dynamic';

const FRESH_CLASS: Record<string, string> = {
  fresh: 'bg-emerald-100 text-emerald-700',
  aging: 'bg-amber-100 text-amber-700',
  stale: 'bg-red-100 text-red-500',
};

export default async function AdminOffersPage({ searchParams }: { searchParams: { e?: string; ok?: string } }) {
  const [offers, products, stores] = await Promise.all([
    prisma.offer.findMany({
      include: { product: { select: { name: true, slug: true } }, store: { select: { name: true } } },
      orderBy: { lastConfirmedAt: 'asc' }, // کهنه‌ها اول — چشم اپراتور روی آن‌ها باشد
      take: 200,
    }),
    prisma.product.findMany({ where: { status: 'ACTIVE' }, select: { id: true, name: true }, orderBy: { name: 'asc' } }),
    prisma.store.findMany({ where: { status: 'ACTIVE' }, select: { id: true, name: true }, orderBy: { name: 'asc' } }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-lg font-extrabold">قیمت‌ها <span className="num text-sm font-normal text-stone-400">({formatNumber(offers.length)})</span></h1>
      <p className="text-xs text-stone-400">مرتب از قدیمی‌ترین تأیید — اولین کار روزانه اپراتور: قیمت‌های قرمز را تلفنی تأیید یا اصلاح کنید.</p>
      {searchParams.e && <p className="rounded-lg bg-red-50 p-2 text-xs text-red-600">{searchParams.e}</p>}
      {searchParams.ok && <p className="rounded-lg bg-emerald-50 p-2 text-xs text-emerald-700">ثبت شد.</p>}

      <details className="card p-4">
        <summary className="cursor-pointer text-sm font-bold">➕ ثبت قیمت برای یک کالا</summary>
        <form action={upsertOfferAction} className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-5">
          <div className="col-span-2"><label className="label">کالا *</label>
            <select name="productId" className="input" required>
              {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div><label className="label">فروشگاه *</label>
            <select name="storeId" className="input" required>
              {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div><label className="label">قیمت (تومان) *</label><input name="price" type="number" className="input num" required /></div>
          <div><label className="label">موجودی</label>
            <select name="availability" className="input">
              <option value="IN_STOCK">موجود</option>
              <option value="OUT_OF_STOCK">ناموجود</option>
              <option value="CALL">تماس بگیرید</option>
            </select>
          </div>
          <div className="col-span-2"><label className="label">توضیح (گارانتی/رنگ)</label><input name="note" className="input" /></div>
          <div className="col-span-2 flex items-end"><button className="btn-primary">ثبت/به‌روزرسانی</button></div>
        </form>
      </details>

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[720px] text-right text-sm">
          <thead>
            <tr className="border-b border-stone-200 text-xs text-stone-500">
              <th className="p-2">کالا</th><th className="p-2">فروشگاه</th><th className="p-2">قیمت فعلی</th>
              <th className="p-2">وضعیت</th><th className="p-2">ویرایش سریع</th><th className="p-2"></th>
            </tr>
          </thead>
          <tbody>
            {offers.map(o => {
              const f = freshnessOf(o.lastConfirmedAt);
              return (
                <tr key={o.id} className="border-b border-stone-100 last:border-0 align-middle">
                  <td className="p-2"><Link href={`/product/${o.product.slug}`} className="text-xs hover:text-brand-600">{o.product.name}</Link></td>
                  <td className="p-2 text-xs">{o.store.name}</td>
                  <td className="num p-2 text-xs">{formatToman(o.price)}</td>
                  <td className="p-2">
                    <span className={`badge ${FRESH_CLASS[f]}`}>{f === 'fresh' ? 'تازه' : f === 'aging' ? 'کهنگی' : 'حذف‌شده از مقایسه'} · {timeAgoFa(o.lastConfirmedAt)}</span>
                    <p className="text-[11px] text-stone-400">{AVAILABILITY_FA[o.availability]}</p>
                  </td>
                  <td className="p-2">
                    <form action={quickUpdateOfferAction} className="flex items-center gap-1">
                      <input type="hidden" name="id" value={o.id} />
                      <input type="hidden" name="back" value="/admin/offers" />
                      <input name="price" defaultValue={o.price} className="input num !w-28 !py-1 text-xs" />
                      <select name="availability" defaultValue={o.availability} className="input !w-20 !py-1 text-xs">
                        <option value="IN_STOCK">موجود</option>
                        <option value="OUT_OF_STOCK">ناموجود</option>
                        <option value="CALL">تماس</option>
                      </select>
                      <button className="btn-primary !px-2 !py-1 text-xs">ثبت</button>
                    </form>
                  </td>
                  <td className="p-2">
                    <div className="flex items-center gap-1">
                      <form action={confirmOfferAction}>
                        <input type="hidden" name="id" value={o.id} />
                        <input type="hidden" name="back" value="/admin/offers" />
                        <button className="btn-ghost !px-2 !py-1 text-[11px]" title="قیمت تغییری نکرده — فقط تأیید">✅ تأیید</button>
                      </form>
                      <form action={deleteOfferAction}>
                        <input type="hidden" name="id" value={o.id} />
                        <button className="btn !px-2 !py-1 text-[11px] text-red-500 hover:bg-red-50">حذف</button>
                      </form>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
