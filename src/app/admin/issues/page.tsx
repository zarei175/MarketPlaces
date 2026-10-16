// صف گزارش‌های خطا (کراودسورسینگ) — رسیدگی روزانه اپراتور

import Link from 'next/link';
import prisma from '@/lib/prisma';
import { formatToman, timeAgoFa, formatNumber } from '@/lib/fa';
import { resolveIssueAction } from '../actions';

export const dynamic = 'force-dynamic';

const TYPE_FA: Record<string, string> = { WRONG_PRICE: 'قیمت اشتباه', OUT_OF_STOCK: 'موجود نبود', OTHER: 'سایر' };

export default async function IssuesPage() {
  const [open, resolved] = await Promise.all([
    prisma.issueReport.findMany({
      where: { status: 'OPEN' },
      include: { offer: { include: { product: { select: { name: true, slug: true } }, store: { select: { name: true } } } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.issueReport.count({ where: { status: 'RESOLVED' } }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-lg font-extrabold">
        گزارش‌های خطا
        <span className="num mr-2 rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-600">{formatNumber(open.length)} باز</span>
        <span className="num mr-2 text-xs font-normal text-stone-400">{formatNumber(resolved)} رسیدگی‌شده</span>
      </h1>

      {open.length === 0 && <p className="card p-6 text-center text-sm text-stone-500">فعلاً گزارش بازی نیست — آفرین!</p>}

      <div className="flex flex-col gap-2">
        {open.map(r => (
          <div key={r.id} className="card p-3 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p>
                <span className="badge bg-amber-100 text-amber-700">{TYPE_FA[r.type]}</span>{' '}
                {r.offer ? (
                  <>
                    «<Link href={`/product/${r.offer.product.slug}`} className="font-semibold hover:text-brand-600">{r.offer.product.name}</Link>»
                    در {r.offer.store.name} — <span className="num">{formatToman(r.offer.price)}</span>
                  </>
                ) : 'کالای تولیدی'}
              </p>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-stone-400">{timeAgoFa(r.createdAt)}</span>
                <form action={resolveIssueAction}>
                  <input type="hidden" name="id" value={r.id} />
                  <button className="btn-primary !py-1 text-xs">رسیدگی شد ✓</button>
                </form>
              </div>
            </div>
            {r.note && <p className="mt-1 text-xs text-stone-500">گزارش کاربر: {r.note}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
