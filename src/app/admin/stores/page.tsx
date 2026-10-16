// مدیریت فروشگاه‌ها: فهرست + ایجاد سریع + تغییر وضعیت/حذف

import Link from 'next/link';
import prisma from '@/lib/prisma';
import { formatNumber, CITIES } from '@/lib/fa';
import { createStoreAction, setStoreStatusAction, deleteStoreAction } from '../actions';

export const dynamic = 'force-dynamic';

const STATUS_FA: Record<string, string> = { PENDING: 'در انتظار تأیید', ACTIVE: 'فعال', SUSPENDED: 'معلول' };
const STATUS_CLASS: Record<string, string> = { PENDING: 'bg-amber-100 text-amber-700', ACTIVE: 'bg-emerald-100 text-emerald-700', SUSPENDED: 'bg-red-100 text-red-600' };

export default async function AdminStoresPage({ searchParams }: { searchParams: { e?: string; ok?: string } }) {
  const stores = await prisma.store.findMany({
    include: { _count: { select: { offers: true, storeItems: true } } },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-lg font-extrabold">فروشگاه‌ها <span className="num text-sm font-normal text-stone-400">({formatNumber(stores.length)})</span></h1>
      {searchParams.e && <p className="rounded-lg bg-red-50 p-2 text-xs text-red-600">{searchParams.e}</p>}

      <details className="card p-4" open={stores.length === 0}>
        <summary className="cursor-pointer text-sm font-bold">➕ افزودن فروشگاه</summary>
        <form action={createStoreAction} className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
          <div><label className="label">نام *</label><input name="name" className="input" required /></div>
          <div><label className="label">تلفن *</label><input name="phone" className="input" placeholder="09xxxxxxxxx" required /></div>
          <div><label className="label">صنف</label><input name="categoryName" className="input" placeholder="لوازم خانگی" /></div>
          <div><label className="label">شهر</label>
            <select name="city" className="input">{CITIES.map(c => <option key={c}>{c}</option>)}</select>
          </div>
          <div className="col-span-2"><label className="label">آدرس</label><input name="address" className="input" /></div>
          <div><label className="label">عرض جغرافیایی (اختیاری)</label><input name="lat" className="input" placeholder="30.5578" /></div>
          <div><label className="label">طول جغرافیایی (اختیاری)</label><input name="lng" className="input" placeholder="49.0633" /></div>
          <div><label className="label">ساعت کاری</label><input name="workingHours" className="input" placeholder="شنبه تا پنجشنبه ۹ تا ۲۱" /></div>
          <div className="col-span-2 flex items-end"><button className="btn-primary">ثبت فروشگاه (فعال)</button></div>
        </form>
      </details>

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[640px] text-right text-sm">
          <thead>
            <tr className="border-b border-stone-200 text-xs text-stone-500">
              <th className="p-2">نام</th><th className="p-2">شهر</th><th className="p-2">تلفن</th>
              <th className="p-2">قیمت‌ها</th><th className="p-2">وضعیت</th><th className="p-2">اقدام</th>
            </tr>
          </thead>
          <tbody>
            {stores.map(s => (
              <tr key={s.id} className="border-b border-stone-100 last:border-0">
                <td className="p-2">
                  <Link href={`/admin/stores/${s.id}`} className="font-semibold hover:text-brand-600">{s.name}</Link>
                  <p className="text-[11px] text-stone-400">{s.categoryName ?? '—'}</p>
                </td>
                <td className="p-2 text-xs">{s.city}</td>
                <td className="num p-2 text-xs">{s.phone}</td>
                <td className="num p-2 text-xs">{formatNumber(s._count.offers + s._count.storeItems)}</td>
                <td className="p-2"><span className={`badge ${STATUS_CLASS[s.status]}`}>{STATUS_FA[s.status]}</span></td>
                <td className="p-2">
                  <div className="flex flex-wrap items-center gap-1">
                    <form action={setStoreStatusAction}>
                      <input type="hidden" name="id" value={s.id} />
                      <input type="hidden" name="status" value={s.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE'} />
                      <button className="btn-ghost !px-2 !py-1 text-[11px]">{s.status === 'ACTIVE' ? 'تعلیق' : 'فعال‌سازی'}</button>
                    </form>
                    <form action={deleteStoreAction}>
                      <input type="hidden" name="id" value={s.id} />
                      <button className="btn !px-2 !py-1 text-[11px] text-red-500 hover:bg-red-50">حذف</button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
