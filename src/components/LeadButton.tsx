'use client';

// دکمه اقدام خریدار (تماس/مسیریابی/نمایش شماره) — هر کلیک به‌عنوان «سرنخ» ثبت می‌شود (LeadEvent)
// شفافیت با فروشنده: این رویدادها بعداً در پنلش با ساعت و تاریخ دیده می‌شوند.

import { useState } from 'react';

type Props = {
  storeId: number;
  offerId?: number;
  type: 'CALL' | 'DIRECTIONS' | 'VIEW_CONTACT';
  phone: string;
  lat?: number | null;
  lng?: number | null;
  storeName?: string;
  address?: string;
};

export default function LeadButton({ storeId, offerId, type, phone, lat, lng, storeName, address }: Props) {
  const [revealed, setRevealed] = useState(false);

  function log() {
    const body = JSON.stringify({ storeId, offerId: offerId ?? null, type });
    if (navigator.sendBeacon) navigator.sendBeacon('/api/lead', new Blob([body], { type: 'application/json' }));
    else fetch('/api/lead', { method: 'POST', body, headers: { 'Content-Type': 'application/json' }, keepalive: true }).catch(() => {});
  }

  if (type === 'VIEW_CONTACT') {
    if (revealed) {
      return (
        <a className="btn-ghost num" href={`tel:${phone}`} onClick={log}>
          📞 {phone}
        </a>
      );
    }
    return (
      <button className="btn-primary" onClick={() => { log(); setRevealed(true); }}>
        📞 نمایش شماره
      </button>
    );
  }

  if (type === 'DIRECTIONS') {
    const href = lat != null && lng != null
      ? `https://neshan.org/maps/@${lat},${lng},16z`
      : `https://neshan.org/maps/search/${encodeURIComponent(`${storeName ?? ''} ${address ?? ''}`)}`;
    return (
      <a className="btn-ghost" href={href} target="_blank" rel="noopener noreferrer" onClick={log}>
        📍 مسیریابی
      </a>
    );
  }

  return (
    <a className="btn-primary" href={`tel:${phone}`} onClick={log}>
      📞 تماس
    </a>
  );
}
