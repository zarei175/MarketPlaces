// داشبورد: سلامت سامانه + «دیتای تقاضا» (جستجوهای بی‌نتیجه — سرمایه فاز پولی، نسخه ۲ بخش ۲.۳)

import Link from 'next/link';
import type { Route } from 'next';
import prisma from '@/lib/prisma';
import { formatNumber } from '@/lib/fa';

export const dynamic = 'force-dynamic';

async function leadsThisWeek() {
  const weekAgo = new Date(Date.now() - 7 * 86_400_000);
  return prisma.leadEvent.count({ where: { createdAt: { gte: weekAgo } } });
}

export default async function AdminDashboard() {
  const [stores, activeStores, products, offers, openIssues, leads, failedSearches, topFailed] = await Promise.all([
    prisma.store.count(),
    prisma.store.count({ where: { status: 'ACTIVE' } }),
    prisma.product.count(),
    prisma.offer.count(),
    prisma.issueReport.count({ where: { status: 'OPEN' } }),
    leadsThisWeek(),
    prisma.searchLog.count({ where: { resultsCount: 0 } }),
    prisma.searchLog.groupBy({
      by: ['query'],
      where: { resultsCount: 0 },
      _count: { query: true },
      orderBy: { _count: { query: 'desc' } },
      take: 10,
    }),
  ]);

  const cards: Array<{ label: string; value: number; sub?: string; href: Route | null }> = [
    { label: 'فروشگاه فعال', value: activeStores, sub: `از ${formatNumber(stores)} کل`, href: '/admin/stores' },
    { label: 'کالا در کاتالوگ', value: products, href: '/admin/products' },
    { label: 'قیمت ثبت‌شده', value: offers, href: '/admin/offers' },
    { label: 'سرنخ این هفته', value: leads, sub: 'تماس/مسیریابی/نمایش شماره', href: null },
    { label: 'خطای باز', value: openIssues, sub: 'نیازمند بررسی', href: '/admin/issues' },
  ];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-lg font-extrabold">داشبورد</h1>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {cards.map(c => {
          const inner = (
            <>
              <p className="num text-xl font-extrabold text-brand-600">{formatNumber(c.value)}</p>
              <p className="text-xs font-medium">{c.label}</p>
              {c.sub && <p className="text-[10px] text-stone-400">{c.sub}</p>}
            </>
          );
          return c.href ? (
            <Link key={c.label} href={c.href} className="card p-3 hover:shadow-md">{inner}</Link>
          ) : (
            <div key={c.label} className="card p-3">{inner}</div>
          );
        })}
      </div>

      <section>
        <h2 className="mb-2 text-sm font-bold">درخواست‌های بدون نتیجه — مردم دنبال چه می‌گردند؟</h2>
        <p className="num mb-2 text-xs text-stone-400">جمع {formatNumber(failedSearches)} جستجوی بی‌نتیجه — هر ردیف یک فرصت کاتالوگ است.</p>
        <div className="card p-2 text-sm">
          {topFailed.length === 0 && <p className="p-2 text-xs text-stone-400">فعلاً جستجوی بی‌نتیجه‌ای ثبت نشده.</p>}
          {topFailed.map(f => (
            <div key={f.query} className="flex items-center justify-between border-b border-stone-100 p-2 last:border-0">
              <span>«{f.query}»</span>
              <span className="num text-xs text-stone-500">{formatNumber(f._count.query)} بار</span>
            </div>
          ))}
        </div>
      </section>

      <section className="card bg-amber-50 p-3 text-xs leading-6 text-amber-800">
        📞 یادآور: قیمت‌هایی که بیش از ۱۴ روز تأیید نشده‌اند برای کاربر «تماس بگیرید» می‌شوند و بیش از ۳۰ روز از مقایسه حذف می‌شوند.
        از صفحه <Link className="underline" href="/admin/offers">قیمت‌ها</Link> یا صفحه هر فروشگاه، تأیید گروهی بزنید.
      </section>
    </div>
  );
}
