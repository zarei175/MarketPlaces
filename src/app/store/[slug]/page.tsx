// صفحه فروشگاه (بخش ۸.۲-۴): معرفی، تماس/مسیریابی (سرنخ)، ساعت کاری، کالاها و تولیدی‌ها

import { notFound } from 'next/navigation';
import Link from 'next/link';
import prisma from '@/lib/prisma';
import { freshnessOf, AVAILABILITY_FA } from '@/lib/freshness';
import { formatToman, formatNumber, timeAgoFa } from '@/lib/fa';
import LeadButton from '@/components/LeadButton';

export const dynamic = 'force-dynamic';

type Params = { slug: string };

/** Next ممکن است پارامتر فارسی را raw (percent-encoded) تحویل دهد — decode ایمن */
function decodeSlug(raw: string): string {
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

async function getStore(rawSlug: string) {
  const slug = decodeSlug(rawSlug);
  return prisma.store.findFirst({
    where: { slug, status: { not: 'SUSPENDED' } },
    include: {
      offers: {
        where: { product: { status: 'ACTIVE' } },
        include: { product: { include: { category: { select: { name: true } } } } },
        orderBy: { updatedAt: 'desc' },
      },
      storeItems: { orderBy: { updatedAt: 'desc' } },
    },
  });
}

export async function generateMetadata({ params }: { params: Params }) {
  const store = await getStore(params.slug);
  if (!store) return {};
  return {
    title: `${store.name} — ${store.city}`,
    description: `کالاها و قیمت‌های فروشگاه ${store.name} در ${store.city} — بازارمه`,
  };
}

export default async function StorePage({ params }: { params: Params }) {
  const store = await getStore(params.slug);
  if (!store) notFound();

  const comparable = store.offers
    .map(o => ({ ...o, freshness: freshnessOf(o.lastConfirmedAt) }))
    .sort((a, b) => (a.freshness === 'stale' ? 1 : 0) - (b.freshness === 'stale' ? 1 : 0) || a.price - b.price);

  return (
    <div className="flex flex-col gap-6">
      <header className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-extrabold text-stone-900">
            {store.name}
            {store.status === 'ACTIVE' && <span title="فروشگاه تأییدشده">✅</span>}
            {store.founder && <span className="badge bg-brand-100 text-brand-700">بنیان‌گذار</span>}
          </h1>
          <p className="text-sm text-stone-500">{store.categoryName ?? 'فروشگاه'} · {store.city}</p>
          <p className="mt-1 text-xs leading-5 text-stone-500">📍 {store.address}</p>
          {store.workingHours && <p className="text-xs text-stone-500">🕐 {store.workingHours}</p>}
        </div>
        <div className="flex shrink-0 flex-col gap-2">
          <LeadButton storeId={store.id} type="VIEW_CONTACT" phone={store.phone} />
          <LeadButton
            storeId={store.id}
            type="DIRECTIONS"
            phone={store.phone}
            lat={store.lat}
            lng={store.lng}
            storeName={store.name}
            address={store.address}
          />
        </div>
      </header>

      {comparable.length > 0 && (
        <section>
          <h2 className="mb-2 text-base font-bold">کالاها و قیمت‌ها <span className="num text-xs font-normal text-stone-400">({formatNumber(comparable.length)})</span></h2>
          <div className="card overflow-x-auto">
            <table className="w-full min-w-[480px] text-right text-sm">
              <thead>
                <tr className="border-b border-stone-200 text-xs text-stone-500">
                  <th className="p-2 font-medium">کالا</th>
                  <th className="p-2 font-medium">قیمت</th>
                  <th className="p-2 font-medium">موجودی</th>
                  <th className="p-2 font-medium">تازگی</th>
                </tr>
              </thead>
              <tbody>
                {comparable.map(o => (
                  <tr key={o.id} className={`border-b border-stone-100 last:border-0 ${o.freshness === 'aging' ? 'opacity-70' : ''}`}>
                    <td className="p-2">
                      <Link href={`/product/${o.product.slug}`} className="font-medium hover:text-brand-600">
                        {o.product.name}
                      </Link>
                    </td>
                    <td className="num p-2 text-brand-600">
                      {o.freshness === 'stale' ? '—' : formatToman(o.price)}
                    </td>
                    <td className="p-2 text-xs">{AVAILABILITY_FA[o.availability]}</td>
                    <td className="p-2 text-[11px] text-stone-500">{timeAgoFa(o.lastConfirmedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {store.storeItems.length > 0 && (
        <section>
          <h2 className="mb-2 text-base font-bold">محصولات تولیدی این کارگاه</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {store.storeItems.map(s => (
              <div key={s.id} className="card p-3">
                <p className="mb-1 text-sm font-semibold">{s.name}</p>
                {s.description && <p className="mb-1 text-xs text-stone-500">{s.description}</p>}
                <p className="num text-sm text-brand-600">{formatToman(s.price)}</p>
                <p className="mt-1 text-[11px] text-stone-400">{AVAILABILITY_FA[s.availability]}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {comparable.length === 0 && store.storeItems.length === 0 && (
        <p className="card p-6 text-center text-sm text-stone-500">فعلاً کالایی برای این فروشگاه ثبت نشده است.</p>
      )}
    </div>
  );
}
