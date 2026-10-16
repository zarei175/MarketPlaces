import type { Metadata } from 'next';
import Link from 'next/link';
import 'vazirmatn/Vazirmatn-font-face.css';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'بازارمه — مقایسه قیمت فروشگاه‌های شهرستان ماهشهر',
    template: '%s | بازارمه',
  },
  description:
    'قبل از خرید، قیمت‌ها را در فروشگاه‌های بندر ماهشهر، بندر امام خمینی و چمران مقایسه کنید. بهترین قیمت، موجودی و آدرس فروشگاه‌ها در بازارمه.',
  keywords: ['قیمت', 'ماهشهر', 'مقایسه قیمت', 'فروشگاه', 'بندر ماهشهر', 'خرید'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl">
      <body className="min-h-screen flex flex-col">
        <header className="sticky top-0 z-40 border-b border-stone-200 bg-white/95 backdrop-blur">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
            <Link href="/" className="flex items-center gap-2 text-lg font-extrabold text-brand-600">
              <span aria-hidden>🛒</span>
              <span>بازارمه</span>
              <span className="hidden text-xs font-normal text-stone-500 sm:inline">مقایسه قیمت ماهشهر</span>
            </Link>
            <nav className="flex items-center gap-3 text-sm">
              <Link href="/" className="text-stone-600 hover:text-brand-600">جستجو</Link>
              <Link href="/vendor/login" className="text-stone-600 hover:text-brand-600">ورود فروشنده</Link>
            </nav>
          </div>
        </header>

        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">{children}</main>

        <footer className="border-t border-stone-200 bg-white">
          <div className="mx-auto flex max-w-5xl flex-col gap-2 px-4 py-4 text-xs text-stone-500 sm:flex-row sm:items-center sm:justify-between">
            <p>
              قیمت‌ها اطلاع‌رسانی است؛ قیمت قطعی در فروشگاه اعلام می‌شود. © بازارمه ۱۴۰۵
            </p>
            <div className="flex items-center gap-3">
              <Link href="/admin" className="hover:text-brand-600">ورود مدیران</Link>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
