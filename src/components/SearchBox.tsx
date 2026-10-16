'use client';

// جستجوی اصلی با تکمیل خودکار (طرح نسخه ۲، بخش ۸.۲-۱)

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatNumber } from '@/lib/fa';

type Suggest = {
  products: { name: string; slug: string; minPrice: number | null; storeCount: number }[];
  stores: { name: string; slug: string }[];
};

export default function SearchBox({ autoFocus = false }: { autoFocus?: boolean }) {
  const [q, setQ] = useState('');
  const [data, setData] = useState<Suggest | null>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    if (q.trim().length < 2) {
      setData(null);
      return;
    }
    timer.current = setTimeout(async () => {
      setBusy(true);
      try {
        const res = await fetch(`/api/suggest?q=${encodeURIComponent(q)}`);
        if (res.ok) {
          setData(await res.json());
          setOpen(true);
        }
      } finally {
        setBusy(false);
      }
    }, 250);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [q]);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  function submit() {
    if (q.trim()) router.push(`/search?q=${encodeURIComponent(q.trim())}`);
  }

  return (
    <div ref={box} className="relative w-full">
      <div className="flex gap-2">
        <input
          className="input !py-3 !text-base"
          placeholder="نام کالا را جستجو کنید… (مثلاً: کولر گازی، گوشی سامسونگ)"
          value={q}
          autoFocus={autoFocus}
          onChange={e => setQ(e.target.value)}
          onFocus={() => data && setOpen(true)}
          onKeyDown={e => e.key === 'Enter' && submit()}
          aria-label="جستجوی کالا"
        />
        <button className="btn-primary !px-5" onClick={submit} disabled={!q.trim()}>
          🔍 <span className="hidden sm:inline">جستجو</span>
        </button>
      </div>

      {open && data && (data.products.length > 0 || data.stores.length > 0) && (
        <div className="absolute z-30 mt-1 w-full rounded-xl border border-stone-200 bg-white shadow-lg">
          {data.products.length > 0 && (
            <div className="border-b border-stone-100 p-1">
              {data.products.map(p => (
                <button
                  key={p.slug}
                  className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-right text-sm hover:bg-brand-50"
                  onClick={() => { setOpen(false); router.push(`/product/${p.slug}`); }}
                >
                  <span>{p.name}</span>
                  <span className="num text-xs text-stone-500">
                    {p.minPrice != null ? `از ${formatNumber(p.minPrice)} تومان` : '—'} · {formatNumber(p.storeCount)} فروشگاه
                  </span>
                </button>
              ))}
            </div>
          )}
          {data.stores.length > 0 && (
            <div className="p-1">
              {data.stores.map(s => (
                <button
                  key={s.slug}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-right text-sm hover:bg-brand-50"
                  onClick={() => { setOpen(false); router.push(`/store/${s.slug}`); }}
                >
                  <span aria-hidden>🏬</span> <span>{s.name}</span>
                  <span className="text-xs text-stone-400">فروشگاه</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      {busy && <p className="absolute left-3 top-3 text-xs text-stone-400">…</p>}
    </div>
  );
}
