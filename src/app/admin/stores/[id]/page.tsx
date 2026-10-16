// ویرایش کامل فروشگاه + قیمت‌هایش + تأیید گروهی (کار روزانه اپراتور — نسخه ۲ بخش ۱۰.۲)

import { notFound } from 'next/navigation';
import Link from 'next/link';
import prisma from '@/lib/prisma';
import { formatToman, timeAgoFa, CITIES } from '@/lib/fa';
import { freshnessOf, AVAILABILITY_FA } from '@/lib/freshness';
import { updateStoreAction, confirmStoreOffersAction, quickUpdateOfferAction } from '../../actions';

export const dynamic = 'force-dynamic';

export default async function EditStorePage({ params, searchParams }: { params: { id: string }; searchParams: { ok?: string } }) {
  const id = Number(params.id);
  const store = await prisma.store.findUnique({
    where: { id },
    include: {
      offers: { include: { product: { select: { name: true, slug: true } } }, orderBy: { product: { name: 'asc' } } },
    },
  });
  if (!store) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-extrabold">{store.name}</h1>
        <Link href={`/store/${store.slug}`} className="btn-ghost !py-1 text-xs">مشاهده صفحه عمومی ↗</Link>
      </div>
      {searchParams.ok && <p className="rounded-lg bg-emerald-50 p-2 text-xs text-emerald-700">ذخیره شد.</p>}

      <form action={updateStoreAction} className="card grid grid-cols-2 gap-3 p-4 text-sm sm:grid-cols-3">
        <input type="hidden" name="id" value={store.id} />
        <div className="col-span-2"><label className="label">نام</label><input name="name" defaultValue={store.name} className="input" required /></div>
        <div><label className="label">تلفن</label><input name="phone" defaultValue={store.phone} className="input" /></div>
        <div><label className="label">صنف</label><input name="categoryName" defaultValue={store.categoryName ?? ''} className="input" /></div>
        <div><label className="label">شهر</label>
          <select name="city" defaultValue={store.city} className="input">{CITIES.map(c => <option key={c}>{c}</option>)}</select>
        </div>
        <div className="col-span-2"><label className="label">آدرس</label><input name="address" defaultValue={store.address} className="input" /></div>
        <div><label className="label">عرض</label><input name="lat" defaultValue={store.lat ?? ''} className="input" /></div>
        <div><label className="label">طول</label><input name="lng" defaultValue={store.lng ?? ''} className="input" /></div>
        <div><label className="label">ساعت کاری</label><input name="workingHours" defaultValue={store.workingHours ?? ''} className="input" /></div>
        <div className="col-span-2"><label className="label">توضیح</label><input name="description" defaultValue={store.description ?? ''} className="input" /></div>
        <label className="flex items-center gap-1 pb-2 text-xs">
          <input type="checkbox" name="founder" defaultChecked={store.founder} /> عضو باشگاه بنیان‌گذاران
        </label>
        <div className="col-span-2 flex items-end sm:col-span-1"><button className="btn-primary">ذخیره</button></div>
      </form>

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-bold">قیمت‌های این فروشگاه</h2>
          <form action={confirmStoreOffersAction}>
            <input type="hidden" name="storeId" value={store.id} />
            <button className="btn-primary !py-1 text-xs">✅ تأیید گروهی همه قیمت‌ها (تماس هفتگی)</button>
          </form>
        </div>
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[560px] text-right text-sm">
            <thead>
              <tr className="border-b border-stone-200 text-xs text-stone-500">
                <th className="p-2">کالا</th><th className="p-2">قیمت (تومان)</th><th className="p-2">موجودی</th><th className="p-2">تازگی</th><th className="p-2"></th>
              </tr>
            </thead>
            <tbody>
              {store.offers.map(o => (
                <tr key={o.id} className="border-b border-stone-100 last:border-0">
                  <td className="p-2">
                    <Link href={`/product/${o.product.slug}`} className="text-xs hover:text-brand-600">{o.product.name}</Link>
                  </td>
                  <td className="num p-2 text-xs text-stone-400">{formatToman(o.price)} ({freshnessOf(o.lastConfirmedAt) === 'fresh' ? 'تازه' : 'کهنه'})</td>
                  <td className="p-2 text-xs">{AVAILABILITY_FA[o.availability]}</td>
                  <td className="p-2 text-[11px] text-stone-500">{timeAgoFa(o.lastConfirmedAt)}</td>
                  <td>
                    <form action={quickUpdateOfferAction} className="flex items-center gap-1">
                      <input type="hidden" name="id" value={o.id} />
                      <input type="hidden" name="back" value={`/admin/stores/${store.id}`} />
                      <input name="price" defaultValue={o.price} className="input num !w-32 !py-1 text-xs" />
                      <select name="availability" defaultValue={o.availability} className="input !w-24 !py-1 text-xs">
                        <option value="IN_STOCK">موجود</option>
                        <option value="OUT_OF_STOCK">ناموجود</option>
                        <option value="CALL">تماس</option>
                      </select>
                      <button className="btn-primary !px-2 !py-1 text-xs">ثبت</button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
