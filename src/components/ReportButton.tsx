'use client';

// دکمه «این قیمت اشتباه است» — کراودسورسینگ کنترل کیفیت داده (طرح نسخه ۲، بخش ۵.۱ روش ۷)

import { useState } from 'react';

export default function ReportButton({ offerId }: { offerId: number }) {
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const [note, setNote] = useState('');
  const [type, setType] = useState('WRONG_PRICE');

  async function send() {
    await fetch('/api/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ offerId, type, note: note || undefined }),
    }).catch(() => {});
    setSent(true);
    setOpen(false);
  }

  if (sent) return <span className="text-xs text-emerald-600">ممنون؛ گزارش شما ثبت شد و بررسی می‌شود.</span>;

  return (
    <>
      <button className="text-xs text-stone-400 underline hover:text-red-500" onClick={() => setOpen(!open)}>
        این قیمت اشتباه است؟
      </button>
      {open && (
        <div className="card mt-2 p-3">
          <select className="input mb-2" value={type} onChange={e => setType(e.target.value)}>
            <option value="WRONG_PRICE">قیمت درست نیست</option>
            <option value="OUT_OF_STOCK">کالا موجود نبود</option>
            <option value="OTHER">مشکل دیگر</option>
          </select>
          <textarea
            className="input mb-2"
            rows={2}
            placeholder="توضیح (اختیاری)"
            value={note}
            onChange={e => setNote(e.target.value)}
          />
          <div className="flex gap-2">
            <button className="btn-primary" onClick={send}>ارسال گزارش</button>
            <button className="btn-ghost" onClick={() => setOpen(false)}>انصراف</button>
          </div>
        </div>
      )}
    </>
  );
}
