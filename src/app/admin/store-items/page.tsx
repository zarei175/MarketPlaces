// کالاهای تولیدی/دست‌ساز هر فروشگاه (نوع CUSTOM — نسخه ۲ بخش ۸.۴)

import prisma from '@/lib/prisma';
import { formatToman, formatNumber } from '@/lib/fa';
import { AVAILABILITY_FA } from '@/lib/freshness';
import { createStoreItemAction, deleteStoreItemAction } from '../actions';

export const dynamic = 'force-dynamic';

export default async function StoreItemsPage({ searchParams }: { searchParams: { e?: string; ok?: string } }) {
  const [items, stores, customCats] = await Promise.all([
    prisma.storeItem.findMany({
      include: { store: { select: { name: true } }, category: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.store.findMany({ where: { status: 'ACTIVE' }, select: { id: true, name: true }, orderBy: { name: 'asc' } }),
    prisma.category.findMany({ where: { kind: 'CUSTOM' }, orderBy: { name: 'asc' } }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-lg font-extrabold">تولیدی‌ها <span className="num text-sm font-normal text-stone-400">({formatNumber(items.length)})</span></h1>
      {searchParams.e && <p className="rounded-lg bg-red-50 p-2 text-xs text-red-600">{searchParams.e}</p>}

      <details className="card p-4" open={items.length === 0}>
        <summary className="cursor-pointer text-sm font-bold">➕ افزودن محصول تولیدی</summary>
        <form action={createStoreItemAction} className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
          <div><label className="label">فروشگاه/کارگاه *</label>
            <select name="storeId" className="input" required>{stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
          </div>
          <div><label className="label">دسته تولیدی *</label>
            <select name="categoryId" className="input" required>{customCats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
          </div>
          <div><label className="label">نام *</label><input name="name" className="input" placeholder="مبل راحتی ۷ نفره" required /></div>
          <div><label className="label">قیمت (تومان) *</label><input name="price" type="number" className="input num" required /></div>
          <div><label className="label">موجودی</label>
            <select name="availability" className="input">
              <option value="IN_STOCK">موجود</option>
              <option value="OUT_OF_STOCK">ناموجود</option>
              <option value="CALL">تماس بگیرید</option>
            </select>
          </div>
          <div className="col-span-2"><label className="label">توضیح</label><input name="description" className="input" /></div>
          <div className="flex items-end"><button className="btn-primary">ثبت</button></div>
        </form>
      </details>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {items.map(i => (
          <div key={i.id} className="card p-3 text-sm">
            <p className="font-semibold">{i.name}</p>
            <p className="num text-xs text-brand-600">{formatToman(i.price)}</p>
            <p className="text-[11px] text-stone-400">{i.store.name} · {i.category.name} · {AVAILABILITY_FA[i.availability]}</p>
            {i.description && <p className="mt-1 text-[11px] text-stone-500">{i.description}</p>}
            <form action={deleteStoreItemAction} className="mt-2">
              <input type="hidden" name="id" value={i.id} />
              <button className="text-[11px] text-red-400 hover:text-red-600">حذف</button>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}
