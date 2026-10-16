// layout پنل فروشنده: محافظت با نشست فروشگاه

import { redirect } from 'next/navigation';
import { requireStore } from '@/lib/auth';
import { vendorLogoutAction } from './actions';

export const dynamic = 'force-dynamic';

export default async function VendorLayout({ children }: { children: React.ReactNode }) {
  const s = requireStore();
  if (!s) redirect('/vendor/login');

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-brand-600">پنل فروشنده بازارمه</p>
        <form action={vendorLogoutAction}>
          <button className="btn-ghost !py-1 text-xs">خروج</button>
        </form>
      </div>
      {children}
    </div>
  );
}
