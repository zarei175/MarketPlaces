// layout پنل مدیریت: محافظت با نشست ادمین + سایدبار ناوبری

import Link from 'next/link';
import type { Route } from 'next';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import { loginOutAction } from './actions';

export const dynamic = 'force-dynamic';

const NAV: Array<{ href: Route; label: string; icon: string }> = [
  { href: '/admin', label: 'داشبورد', icon: '📊' },
  { href: '/admin/stores', label: 'فروشگاه‌ها', icon: '🏬' },
  { href: '/admin/products', label: 'کالاها', icon: '📦' },
  { href: '/admin/offers', label: 'قیمت‌ها', icon: '💰' },
  { href: '/admin/store-items', label: 'تولیدی‌ها', icon: '🛋️' },
  { href: '/admin/taxonomy', label: 'دسته‌ها و برندها', icon: '🗂️' },
  { href: '/admin/issues', label: 'گزارش‌های خطا', icon: '🐞' },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = requireAdmin();
  if (!session) redirect('/login');

  return (
    <div className="flex flex-col gap-4 sm:flex-row">
      <aside className="sm:w-52 sm:shrink-0">
        <div className="card sticky top-16 p-3">
          <p className="mb-2 px-2 text-xs text-stone-400">
            {session.username} · {session.role === 'ADMIN' ? 'مدیر' : 'اپراتور'}
          </p>
          <nav className="flex flex-wrap gap-1 sm:flex-col">
            {NAV.map(n => (
              <Link key={n.href} href={n.href} className="rounded-lg px-2 py-1.5 text-sm text-stone-700 hover:bg-brand-50 hover:text-brand-700">
                <span aria-hidden>{n.icon}</span> {n.label}
              </Link>
            ))}
            <form action={loginOutAction}>
              <button className="w-full rounded-lg px-2 py-1.5 text-right text-sm text-red-500 hover:bg-red-50">🚪 خروج</button>
            </form>
          </nav>
        </div>
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
