// صفحه کالا — قلب سامانه (نسخه ۲ بخش ۸.۲-۳):
// جدول مقایسه فروشگاه‌ها (ارزان‌ترینِ به‌روز اول؛ کهنه‌ها پایین‌تر)، تاریخچه قیمت، گزارش خطا

import { notFound } from 'next/navigation';
import Link from 'next/link';
import prisma from '@/lib/prisma';
import { toProductView, type OfferView } from '@/lib/queries';
import { freshnessOf, AVAILABILITY_FA } from '@/lib/freshness';
import { formatToman, formatNumber, timeAgoFa } from '@/lib/fa';
import LeadButton from '@/components/LeadButton';
import ReportButton from '@/components/ReportButton';

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

async function getProduct(rawSlug: string) {
  const slug = decodeSlug(rawSlug);
  const product = await prisma.product.findFirst({
    where: { slug, status: 'ACTIVE' },
    include: {
      offers: {
        where: { store: { status: 'ACTIVE' } },
        include: { store: true, history: { orderBy: { at: 'asc' } } },
      },
      brand: true,
      category: { include: { parent: true } },
    },
  });
  return product;
}

export async function generateMetadata({ params }: { params: Params }) {
  const product = await getProduct(params.slug);
  if (!product) return {};
  return {
    title: `قیمت ${product.name} در ماهشهر`,
    description: `مقایسه قیمت ${product.name} بین ${product.offers.length} فروشگاه شهرستان ماهشهر — بازارمه`,
  };
}

const freshBadge: Record<string, string> = {
  fresh: 'bg-emerald-100 text-emerald-700',
  aging: 'bg-amber-100 text-amber-700',
  stale: 'bg-stone-200 text-stone-500',
};

function OfferRow({ offer, productId }: { offer: OfferView; productId: number }) {
  const aging = offer.freshness === 'aging';
  const stale = offer.freshness === 'stale';
  return (
    <tr className={`border-b border-stone-100 last:border-0 ${aging ? 'opacity-70' : ''} ${stale ? 'hidden' : ''}`}>
      <td className="p-2">
        <Link href={`/store/${offer.store.slug}`} className="font-semibold text-stone-800 hover:text-brand-600">
          {offer.store.name}
        </Link>
        <p className="text-[11px] text-stone-400">{offer.store.city}</p>
      </td>
      <td className="num p-2 font-bold text-brand-600">{formatToman(offer.price)}</td>
      <td className="p-2 text-xs">{AVAILABILITY_FA[offer.availability]}</td>
      <td className="p-2 text-[11px] text-stone-500">{timeAgoFa(offer.lastConfirmedAt)}</td>
      <td className="p-2 text-[11px] text-stone-400">{offer.note ?? '—'}</td>
      <td className="flex flex-wrap items-center gap-1 p-2">
        {aging ? (
          <span className="badge bg-amber-100 text-amber-700">قیمت قدیمی — تماس بگیرید</span>
        ) : (
          <>
            <LeadButton storeId={offer.store.id} offerId={offer.id} type="CALL" phone={offer.store.phone} />
            <LeadButton
              storeId={offer.store.id}
              offerId={offer.id}
              type="DIRECTIONS"
              phone={offer.store.phone}
              lat={offer.store.lat}
              lng={offer.store.lng}
              storeName={offer.store.name}
              address={offer.store.address}
            />
          </>
        )}
      </td>
    </tr>
  );
}

/** نمودار خطی تاریخچه قیمت — SVG بدون وابستگی */
function PriceChart({ points }: { points: Array<{ at: Date; price: number; store: string }> }) {
  if (points.length < 2) return <p className="p-3 text-xs text-stone-500">برای رسم نمودار، به چند تغییر قیمت دیگر نیاز است.</p>;
  const W = 600, H = 200, PAD = 30;
  const prices = points.map(p => p.price);
  const min = Math.min(...prices), max = Math.max(...prices);
  const t0 = new Date(points[0].at).getTime();
  const t1 = new Date(points[points.length - 1].at).getTime() || t0 + 1;
  const x = (at: Date) => PAD + ((new Date(at).getTime() - t0) / (t1 - t0)) * (W - 2 * PAD);
  const y = (price: number) => H - PAD - ((price - min) / (max - min || 1)) * (H - 2 * PAD);
  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(p.at).toFixed(1)},${y(p.price).toFixed(1)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="نمودار تاریخچه قیمت">
      <line x1={PAD} y1={H - PAD} x2={W - PAD} y2={H - PAD} stroke="#e7e5e4" />
      <line x1={PAD} y1={PAD} x2={PAD} y2={H - PAD} stroke="#e7e5e4" />
      <path d={path} fill="none" stroke="#f97316" strokeWidth="2" />
      {points.map((p, i) => (
        <circle key={i} cx={x(p.at)} cy={y(p.price)} r="3" fill="#f97316" />
      ))}
      <text x={PAD} y={PAD - 10} className="num" fontSize="11" fill="#78716c">{formatNumber(max)}</text>
      <text x={PAD} y={H - PAD + 15} fontSize="11" fill="#78716c">قدیمی‌ترین</text>
      <text x={W - PAD - 30} y={H - PAD + 15} fontSize="11" fill="#78716c">جدیدترین</text>
    </svg>
  );
}

export default async function ProductPage({ params }: { params: Params }) {
  const raw = await getProduct(params.slug);
  if (!raw) notFound();

  const view = toProductView(raw);
  const comparable = view.offers.filter(o => o.freshness !== 'stale');
  const best = comparable[0];
  const historyPoints = raw.offers.flatMap(o =>
    o.history.map(h => ({ at: h.at, price: h.price, store: o.store.name })),
  ).sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());

  return (
    <div className="flex flex-col gap-6">
      <nav className="text-xs text-stone-400">
        <Link href="/">بازارمه</Link>
        {' / '}
        {raw.category.parent && (
          <>
            <Link href={`/category/${raw.category.parent.slug}`}>{raw.category.parent.name}</Link>
            {' / '}
          </>
        )}
        <Link href={`/category/${raw.category.slug}`}>{raw.category.name}</Link>
      </nav>

      <header className="flex flex-col gap-1">
        <h1 className="text-xl font-extrabold text-stone-900 sm:text-2xl">{view.name}</h1>
        <p className="text-xs text-stone-500">
          {view.brandName ?? raw.category.name}
          {best && (
            <> · بهترین قیمت فعال: <span className="num font-bold text-brand-600">{formatToman(best.price)}</span> در {best.store.name}</>
          )}
        </p>
      </header>

      {comparable.length === 0 ? (
        <div className="card p-6 text-center text-sm text-stone-500">
          فعلاً قیمت به‌روزی از فروشگاه‌ها نرسیده؛ لطفاً بعداً مراجعه کنید یا با فروشگاه‌های ثبت‌شده تماس بگیرید.
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[560px] text-right text-sm">
            <thead>
              <tr className="border-b border-stone-200 text-xs text-stone-500">
                <th className="p-2 font-medium">فروشگاه</th>
                <th className="p-2 font-medium">قیمت</th>
                <th className="p-2 font-medium">موجودی</th>
                <th className="p-2 font-medium">تازگی قیمت</th>
                <th className="p-2 font-medium">توضیح</th>
                <th className="p-2 font-medium">اقدام</th>
              </tr>
            </thead>
            <tbody>
              {view.offers.map(o => <OfferRow key={o.id} offer={o} productId={view.id} />)}
            </tbody>
          </table>
          <p className="border-t border-stone-100 bg-stone-50 p-2 text-[11px] leading-5 text-stone-500">
            رتبه‌بندی بر اساس قیمت فروشی است و قابل خرید نیست — ارزان‌ترین قیمتِ به‌روز همیشه بالای جدول است.
            قیمت‌های بیش از ۳۰ روز قدیمی از مقایسه حذف می‌شوند و ۱۴ تا ۳۰ روزه‌ها «تماس بگیرید» هستند.
          </p>
        </div>
      )}

      <section className="card p-4">
        <h2 className="mb-2 text-base font-bold">تاریخچه قیمت</h2>
        <PriceChart points={historyPoints} />
      </section>

      {comparable.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-bold">گزارش خطا</h2>
          <div className="flex flex-col gap-2">
            {comparable.map(o => (
              <div key={o.id} className="card flex flex-col gap-1 p-2 text-xs">
                <p className="font-semibold">{o.store.name} — <span className="num">{formatToman(o.price)}</span></p>
                <ReportButton offerId={o.id} />
              </div>
            ))}
          </div>
        </section>
      )}

      <p className="text-[11px] text-stone-400">
        جمع {formatNumber(view.offers.length)} فروشگاه این کالا را عرضه می‌کنند؛ قیمت‌ها اطلاع‌رسانی است و قیمت قطعی در فروشگاه اعلام می‌شود.
      </p>
    </div>
  );
}
