// ورود مدیران و اپراتورهای داده

import { loginAction } from './actions';

export const dynamic = 'force-dynamic';

export default async function LoginPage({ searchParams }: { searchParams: { e?: string } }) {
  const error =
    searchParams.e === 'wrong' ? 'نام کاربری یا رمز اشتباه است.'
    : searchParams.e === 'missing' ? 'نام کاربری و رمز را وارد کنید.'
    : null;

  return (
    <div className="mx-auto mt-10 max-w-sm">
      <div className="card p-6">
        <h1 className="mb-4 text-lg font-extrabold">ورود مدیران بازارمه</h1>
        <form action={loginAction} className="flex flex-col gap-3">
          <div>
            <label className="label">نام کاربری</label>
            <input name="username" className="input" autoComplete="username" required />
          </div>
          <div>
            <label className="label">رمز عبور</label>
            <input name="password" type="password" className="input" autoComplete="current-password" required />
          </div>
          {error && <p className="rounded-lg bg-red-50 p-2 text-xs text-red-600">{error}</p>}
          <button className="btn-primary">ورود</button>
        </form>
      </div>
      <p className="mt-3 text-center text-xs text-stone-400">فروشنده‌ها از <a className="text-brand-600 underline" href="/vendor/login">ورود فروشندگان</a> استفاده می‌کنند.</p>
    </div>
  );
}
