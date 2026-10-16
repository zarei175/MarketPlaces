# دستورالعمل ایجنت — Mahshahr_Marketplaces

پلتفرم مقایسه قیمت محلی شهرستان ماهشهر (مشابه ترب، محلی‌شده) — Next.js 14 + Prisma/SQLite، رابط فارسی RTL. وضعیت فعلی: MVP ابتدایی متوقف‌شده + پروپوزال کسب‌وکار؛ کار جاری: تهیه طرح جامع پیش از توسعه.
**زبان پاسخ: فارسی**

## قواعد اجرا (اجباری)

1. **قبل از هر تسک:** `.brain/OPERATING-SYSTEM.md` و `.brain/DECISIONS.md` را کامل بخوان.
2. **هر نوع کار تکرارشونده:** رویه‌اش در `.brain/WORKFLOWS/<نوع>.md` است؛ اگر نبود، در پایان همان کار ورک‌فلویش را بساز.
3. **بعد از هر تصمیم/اصلاح مهم:** همان لحظه یک خط به `.brain/DECISIONS.md` اضافه کن (تاریخ + تصمیم + چرا). هرگز نگو «بعداً یادداشت می‌کنم».
4. **درخواست جدید کاربر** → اول در `00-INBOX/` ثبت کن، بعد پردازش کن.
5. **بعد از هر تغییر در `AGENTS.md` یا `.brain/`:** `python .brain/validate_brain.py` اجرا شود (خروجی ۲ = خطای ساختاری).

## نقشه پروژه

- `mahshahr_marketplace_proposal.pdf` — پروپوزال ۲۶ صفحه‌ای کسب‌وکار (سند مرجع، تهیه پیش از توقف)
- `prompt.txt` — خواسته‌های کاربر (سند ورودی، 2026-10-15)
- `PLAN.md` — طرح جامع پروژه (خروجی مرحله فعلی؛ پیش از اجرای هر کد، تأیید کاربر لازم است)
- `src/app/` — اپ Next.js (App Router): `page.tsx` صفحه اصلی، `api/products/` CRUD ساده، `layout.tsx` فارسی RTL
- `prisma/schema.prisma` — مدل داده فعلی (فقط `Product`)، `prisma/dev.db` — دیتابیس SQLite با ۲ رکورد تستی
- `.brain/` — چرخه brain پروژه

## خطاهای پرتکرار (هرگز تکرار نکن)

- **اتصال Supabase فقط از session pooler پورت ۵۴۳۲.** پورت ۶۵۴۳ (transaction) از شبکه ایران ناپایدار است (P1017/P1001). handshake از ایران تا ۴۱ ثانیه طول کشیده → `connect_timeout=60` در URL الزامی است.
- **`prisma db push`/`migrate dev` روی Supabase از این شبکه شکست می‌خورد** (schema engine به host نمی‌رسد): به‌جایش `prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script > prisma/init.sql` و اجرای فایل با psycopg2 (یا `prisma db execute` روی session URL).
- **هر فایل Server Action باید خط اولش `'use server' باشد**؛ وگرنه در runtime خطای «Functions cannot be passed to Client Components».
- **پارامتر dynamic segment فارسی را با `decodeURIComponent` ایمن decode کن** (صفحات product/store/category نمونه دارند) — وگرنه 404.
- **در `slugifyFa` خط تیره باید در بازه مجاز بماند** (`[^a-z0-9\u0600-\u06FF -]`) — وگرنه کلمات در slug می‌چسبند.
- **جداول فیزیکی snake_case با `@map`/`@@map`** — SQL خام (pg_trgm، ایندکس‌ها) باید lowercase بنویسد.
- `typedRoutes` فعال است → href داینامیک `Link` باید نوع `Route` بگیرد.
