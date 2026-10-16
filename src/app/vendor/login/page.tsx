'use client';

// ورود فروشنده: موبایل → کد پیامکی → (اگر جدید) فرم کوتاه فروشگاه (نسخه ۲ بخش ۸.۳)

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Step = 'mobile' | 'code' | 'register';

export default function VendorLoginPage() {
  const [step, setStep] = useState<Step>('mobile');
  const [mobile, setMobile] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', categoryName: '', address: '', city: 'بندر ماهشهر' });
  const router = useRouter();

  async function call(url: string, body: object): Promise<any> {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      return await res.json();
    } catch {
      setError('ارتباط برقرار نشد؛ دوباره تلاش کنید.');
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function sendCode(e: React.FormEvent) {
    e.preventDefault();
    const r = await call('/api/vendor/otp', { mobile });
    if (r?.ok) setStep('code');
    else if (r?.error) setError(r.error);
  }

  async function checkCode(e: React.FormEvent) {
    e.preventDefault();
    const r = await call('/api/vendor/verify', { mobile, code });
    if (!r?.ok) { setError(r?.error ?? 'کد درست نیست'); return; }
    if (r.registered) router.push('/vendor');
    else setStep('register');
  }

  async function register(e: React.FormEvent) {
    e.preventDefault();
    const r = await call('/api/vendor/register', { ...form, phone: form.phone || mobile });
    if (r?.ok) router.push('/vendor');
    else setError(r?.error ?? 'ثبت ناموفق بود');
  }

  return (
    <div className="mx-auto mt-8 max-w-sm">
      <div className="card p-6">
        <h1 className="mb-1 text-lg font-extrabold">ورود فروشندگان</h1>
        <p className="mb-4 text-xs text-stone-400">ویترین مغازه شما، ۲۴ ساعته در دسترس مردم ماهشهر — پلن پایه برای همیشه رایگان است.</p>

        {step === 'mobile' && (
          <form onSubmit={sendCode} className="flex flex-col gap-3">
            <div>
              <label className="label">شماره موبایل</label>
              <input className="input num" dir="ltr" placeholder="09xxxxxxxxx" value={mobile}
                onChange={e => setMobile(e.target.value)} required />
            </div>
            <button className="btn-primary" disabled={busy}>ارسال کد</button>
          </form>
        )}

        {step === 'code' && (
          <form onSubmit={checkCode} className="flex flex-col gap-3">
            <p className="text-xs text-stone-500">کد ارسال‌شده به {mobile} را وارد کنید.</p>
            <input className="input num text-center text-lg tracking-widest" dir="ltr" maxLength={6} placeholder="------"
              value={code} onChange={e => setCode(e.target.value)} required />
            <button className="btn-primary" disabled={busy}>تأیید</button>
            <button type="button" className="btn-ghost" onClick={() => setStep('mobile')}>ویرایش شماره</button>
          </form>
        )}

        {step === 'register' && (
          <form onSubmit={register} className="flex flex-col gap-3 text-sm">
            <p className="text-xs text-stone-500">پروفایل فروشگاه را کامل کنید (تأیید نهایی توسط مدیر انجام می‌شود):</p>
            <div><label className="label">نام فروشگاه *</label>
              <input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
            <div><label className="label">تلفن فروشگاه (خالی = همان موبایل)</label>
              <input className="input num" dir="ltr" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
            <div><label className="label">صنف</label>
              <input className="input" placeholder="لوازم خانگی، موبایل…" value={form.categoryName} onChange={e => setForm({ ...form, categoryName: e.target.value })} /></div>
            <div><label className="label">شهر</label>
              <select className="input" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })}>
                <option>بندر ماهشهر</option><option>بندر امام خمینی</option><option>چمران</option>
              </select></div>
            <div><label className="label">آدرس *</label>
              <input className="input" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} required /></div>
            <button className="btn-primary" disabled={busy}>ثبت فروشگاه</button>
          </form>
        )}

        {error && <p className="mt-3 rounded-lg bg-red-50 p-2 text-xs text-red-600">{error}</p>}
      </div>
    </div>
  );
}
