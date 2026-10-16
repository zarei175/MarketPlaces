# حقایق پایدار پروژه (FACTS)

فقط اطلاعات تأییدشده. هر ردیف باید منبع داشته باشد. به‌روزرسانی: ایجنت بعد از تأیید کاربر.

## پشته فنی و وضعیت کد
- پشته: Next.js 14.2.5، React 18.2.0، @prisma/client 5.16.2، SQLite، TypeScript 5.4.5، ESLint 8.57 — منبع: package.json (بررسی 2026-10-15)
- مدل داده فعلی فقط `Product` است (name/description/price/تاریخ‌ها)؛ فروشگاه، دسته‌بندی، پیشنهاد قیمت و کاربر هنوز مدل نشده‌اند — منبع: prisma/schema.prisma (2026-10-15)
- دیتابیس `prisma/dev.db` ساخته شده و ۲ رکورد تستی دارد («کتاب»، «در پناه خدا») — منبع: بررسی sqlite3 (2026-10-15)
- رابط فارسی RTL است (`lang="fa" dir="rtl"`) — منبع: src/app/layout.tsx
- API فعلی: `GET/POST /api/products` — منبع: src/app/api/products/route.ts

## زیرساخت
- پروژه Supabase «MarketPlaces» — ref: krdnkfssdqdllbwnraup، region: ap-northeast-1 (توکیو)، PostgreSQL 17، ساخته 2026-10-15 — منبع: Supabase Management API
- هاست قدیمی دیتابیس (`db.<ref>.supabase.co`) در DNS رزولوت نمی‌شود (پروژه‌های جدید Supabase)؛ اتصال فقط از طریق pooler: session پورت ۵۴۳۲ (تست موفق 2026-10-15)؛ transaction پورت ۶۵۴۳ از این شبکه TCP باز ولی handshake کند/ناپایدار — منبع: تست‌های اتصال 2026-10-15/16
- همه کلیدها/توکن‌ها (Supabase: access token و anon/service_role؛ کاوه‌نگار؛ رمز DB) فقط در `.env` محلی هستند و به مخزن پوش نمی‌شوند — منبع: .gitignore + بررسی git status 2026-10-15
- شبکه ایران↔Supabase توکیو در 2026-10-16 به‌شدت کند بود (handshake تا ۴۱ ثانیه، اندازه‌گیری psycopg2) — دلیل `connect_timeout=60` در URLها — منبع: تست 2026-10-16
- دستور کاربر: seed از `ADMIN_USERNAME`/`ADMIN_PASSWORD` فایل .env ادمین اولیه را می‌سازد؛ منطق verify رمز (pbkdf2) تست‌شده PASS — منبع: تست 2026-10-16
- `next.config.mjs`: typedRoutes فعال — href داینامیک Link باید نوع Route بگیرد — منبع: next.config.mjs + خطای build 2026-10-16
- دیتابیس: ۱۵ جدول snake_case (via @map) + pg_trgm + ایندکس trgm روی products/stores/store_items — منبع: prisma/init.sql اعمال‌شده 2026-10-16
- seed (2026-10-16): ۱۴ دسته (۴ والد + ۱۰ فرزند)، ۱۰ برند، ۷ فروشگاه دمو با پیشوند «(نمونه)»، ۸ کالا، ۱۴ قیمت، ۲ تولیدی — منبع: prisma/seed.mjs

## کسب‌وکار
- هدف پروژه: پلتفرم مقایسه قیمت فروشگاه‌ها/تولیدی‌های شهرستان ماهشهر، کارکردی مشابه torob.com — منبع: prompt.txt (2026-10-15)
- منبع درآمد: فروشگاه‌های متصل به سامانه؛ مدل دقیق باید در PLAN.md پیشنهاد و پس از تأیید کاربر قطعی شود — منبع: prompt.txt بند ۳
- پروپوزال موجود: ۲۶ صفحه در ۶ بخش (استراتژی، مدل درآمدی، محصول، GTM، چالش‌ها، نقشه راه ۴ فازی) — منبع: mahshahr_marketplace_proposal.pdf (استخراج 2026-10-15)
- مدل درآمدی پیشنهادی پروپوزال: فاز ۱ Freemium → فاز ۲ CPC → فاز ۳ لیستینگ ویژه؛ مدل CPS رد شده — منبع: پروپوزال ص ۹–۱۱
- کار پروژه چند ماه متوقف بوده و با درخواست 2026-10-15 از سر گرفته می‌شود — منبع: prompt.txt بند ۱–۲
