// Seed بازارمه: ادمین اولیه + دسته‌های شروع (نسخه ۲ بخش ۱۱.۲) + برندها + داده دمو قابل حذف
// اجرا: node --env-file=.env prisma/seed.mjs   (idempotent — اگر داده باشد فقط پیام می‌دهد)
// روی DIRECT_URL (session pooler) اجرا می‌شود؛ pooler تراکنشی وسط seed اتصال را نمی‌بندد.
import { PrismaClient } from '@prisma/client'
import { pbkdf2Sync, randomBytes } from 'node:crypto'

const prisma = new PrismaClient({ datasourceUrl: process.env.DIRECT_URL })

// نسخه inline نرمال‌سازی (همان منطق src/lib/fa.ts برای اجرای مستقل node)
function normalizeFa(s) {
  let x = s
    .replace(/ي/g, 'ی').replace(/ك/g, 'ک').replace(/ة/g, 'ه')
    .replace(/[أإآ]/g, 'ا').replace(/ؤ/g, 'و').replace(/ئ/g, 'ی')
    .replace(/[\u064B-\u0652\u0670\u0640]/g, '')
    .replace(/[\u06F0-\u06F9\u0660-\u0669]/g, d => String(d.charCodeAt(0) & 0xf))
    .replace(/[\u200c\u200f\u200e]/g, ' ')
    .replace(/[«»"'()\[\]{};:,!.?؟،؛]/g, ' ')
  return x.replace(/\s+/g, ' ').trim().toLowerCase()
}
const slugify = s => normalizeFa(s).replace(/[^a-z0-9\u0600-\u06FF -]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 80)

function hashPassword(pw) {
  const salt = randomBytes(16).toString('hex')
  return `pbkdf2:100000:${salt}:${pbkdf2Sync(pw, salt, 100000, 32, 'sha256').toString('hex')}`
}

async function main() {
  const existing = await prisma.adminUser.count()
  if (existing > 0) {
    console.log('داده از قبل هست — seed رد شد.')
    return
  }

  // ── ادمین اولیه ──
  await prisma.adminUser.create({
    data: {
      username: process.env.ADMIN_USERNAME || 'admin',
      passwordHash: hashPassword(process.env.ADMIN_PASSWORD || 'Bazarme-Admin-2026'),
      role: 'ADMIN',
    },
  })

  // ── دسته‌های شروع (نسخه ۲ بخش ۱۱.۲) ──
  const cats = [
    { name: 'لوازم خانگی و سرمایشی', icon: '🏠', children: ['کولر گازی', 'یخچال و فریزر', 'ماشین لباسشویی', 'تلویزیون'] },
    { name: 'موبایل و لوازم جانبی', icon: '📱', children: ['موبایل', 'لوازم جانبی موبایل'] },
    { name: 'ابزار و مصالح ساختمانی', icon: '🔧', children: ['ابزار برقی', 'یراق‌آلات'] },
    { name: 'تولیدی‌ها و دست‌سازها', icon: '🛋️', kind: 'CUSTOM', children: ['مبل', 'کابینت'] },
  ]
  const catId = {}
  for (const c of cats) {
    const parent = await prisma.category.create({
      data: { name: c.name, slug: slugify(c.name), icon: c.icon, kind: c.kind || 'STANDARD', sortOrder: cats.indexOf(c) },
    })
    catId[c.name] = parent.id
    for (const ch of c.children) {
      const child = await prisma.category.create({ data: { name: ch, slug: slugify(`${c.name}-${ch}`), parentId: parent.id, kind: c.kind || 'STANDARD' } })
      catId[`${c.name}/${ch}`] = child.id
    }
  }

  // ─── برندها ───
  const brands = ['سامسونگ', 'ال‌جی', 'اسنوا', 'جنرال', 'بوش', 'هایر', 'شیائومی', 'اپل', 'پاکشوما', 'مادا']
  const brandId = {}
  for (const b of brands) {
    const brand = await prisma.brand.create({ data: { name: b, slug: slugify(b) } })
    brandId[b] = brand.id
  }

  // ─── فروشگاه‌های دمو (نام با پیشوند «نمونه» — از پنل ادمین قابل حذف) ───
  const demoStores = [
    { name: '(نمونه) خانه‌های برتر ماهشهر', phone: '09160000001', categoryName: 'لوازم خانگی', address: 'بندر ماهشهر، بلوار امام خمینی، پاساژ نور، پلاک ۱۲', lat: 30.5590, lng: 49.0700 },
    { name: '(نمونه) سرد و گرم خلیج', phone: '09160000002', categoryName: 'لوازم خانگی', address: 'بندر ماهشهر، خیابان شهید چمران، پاساژ خلیج', lat: 30.5630, lng: 49.0620 },
    { name: '(نمونه) پارس کولر', phone: '09160000003', categoryName: 'لوازم خانگی', address: 'بندر ماهشهر، بلوار فرهنگیان، پلاک ۴۵', lat: 30.5520, lng: 49.0550 },
    { name: '(نمونه) موبایل سنتر بندر', phone: '09160000004', categoryName: 'موبایل', address: 'بندر ماهشهر، بازار مرکزی، طبقه اول، واحد ۸', lat: 30.5570, lng: 49.0640 },
    { name: '(نمونه) تکنو بندر', phone: '09160000005', categoryName: 'موبایل', address: 'بندر ماهشهر، بلوار گلها، پلاک ۲۱', lat: 30.5600, lng: 49.0450 },
    { name: '(نمونه) ابزار پتروشیمی', phone: '09160000006', categoryName: 'ابزار', address: 'بندر ماهشهر، جاده صنعتی شماره ۲', lat: 30.5480, lng: 49.0800 },
    { name: '(نمونه) مبلمان آرا', phone: '09160000007', categoryName: 'مبل‌سازی', address: 'بندر ماهشهر، خیابان انقلاب، کارگاه مبلمان آرا', lat: 30.5500, lng: 49.0430 },
  ]
  const storeId = {}
  for (const s of demoStores) {
    const st = await prisma.store.create({
      data: { ...s, slug: slugify(s.name), city: 'بندر ماهشهر', status: 'ACTIVE', workingHours: 'شنبه تا پنجشنبه ۹ تا ۲۱' },
    })
    storeId[s.name] = st.id
  }

  // ─── کالاهای دمو + قیمت‌ها (برای تست جدول مقایسه) ───
  const demoProducts = [
    {
      name: 'کولر گازی جنرال ۲۴ هزار اینورتر', category: 'لوازم خانگی و سرمایشی/کولر گازی', brand: 'جنرال',
      offers: [
        { store: '(نمونه) خانه‌های برتر ماهشهر', price: 46_800_000 },
        { store: '(نمونه) سرد و گرم خلیج', price: 44_900_000 },
        { store: '(نمونه) پارس کولر', price: 42_500_000 },
      ],
    },
    {
      name: 'کولر گازی سامسونگ ۱۸ هزار', category: 'لوازم خانگی و سرمایشی/کولر گازی', brand: 'سامسونگ',
      offers: [
        { store: '(نمونه) پارس کولر', price: 33_900_000 },
        { store: '(نمونه) سرد و گرم خلیج', price: 35_200_000 },
      ],
    },
    {
      name: 'یخچال فریزر اسنوا ساید بای ساید ۲۲ فوت', category: 'لوازم خانگی و سرمایشی/یخچال و فریزر', brand: 'اسنوا',
      offers: [{ store: '(نمونه) خانه‌های برتر ماهشهر', price: 58_500_000 }],
    },
    {
      name: 'ماشین لباسشویی پاکشوما ۸ کیلویی', category: 'لوازم خانگی و سرمایشی/ماشین لباسشویی', brand: 'پاکشوما',
      offers: [
        { store: '(نمونه) سرد و گرم خلیج', price: 21_400_000 },
        { store: '(نمونه) خانه‌های برتر ماهشهر', price: 22_900_000 },
      ],
    },
    {
      name: 'گوشی سامسونگ Galaxy A55', category: 'موبایل و لوازم جانبی/موبایل', brand: 'سامسونگ',
      offers: [
        { store: '(نمونه) موبایل سنتر بندر', price: 18_900_000 },
        { store: '(نمونه) تکنو بندر', price: 19_400_000 },
      ],
    },
    {
      name: 'گوشی شیائومی Redmi Note 13', category: 'موبایل و لوازم جانبی/موبایل', brand: 'شیائومی',
      offers: [
        { store: '(نمونه) تکنو بندر', price: 12_750_000 },
        { store: '(نمونه) موبایل سنتر بندر', price: 13_200_000 },
      ],
    },
    {
      name: 'دریل چکشی بوش GSB 13 RE', category: 'ابزار و مصالح ساختمانی/ابزار برقی', brand: 'بوش',
      offers: [{ store: '(نمونه) ابزار پتروشیمی', price: 8_900_000 }],
    },
    {
      name: 'مینی فرز مادا ۸۵۰ وات', category: 'ابزار و مصالح ساختمانی/ابزار برقی', brand: 'مادا',
      offers: [{ store: '(نمونه) ابزار پتروشیمی', price: 2_450_000, availability: 'OUT_OF_STOCK' }],
    },
  ]

  for (const p of demoProducts) {
    const product = await prisma.product.create({
      data: { name: p.name, normalizedName: normalizeFa(p.name), slug: slugify(p.name), categoryId: catId[p.category], brandId: brandId[p.brand], status: 'ACTIVE' },
    })
    for (const o of p.offers) {
      const offer = await prisma.offer.create({
        data: { productId: product.id, storeId: storeId[o.store], price: o.price, availability: o.availability || 'IN_STOCK', source: 'OPERATOR' },
      })
      await prisma.priceHistory.create({ data: { offerId: offer.id, price: o.price, availability: o.availability || 'IN_STOCK' } })
    }
  }

  // ─── کالای تولیدی دمو (غیراستاندارد — کارت مستقل) ───
  await prisma.storeItem.createMany({
    data: [
      { storeId: storeId['(نمونه) مبلمان آرا'], categoryId: catId['تولیدی‌ها و دست‌سازها/مبل'], name: 'مبل راحتی ۷ نفره پارچه‌ای', normalizedName: normalizeFa('مبل راحتی ۷ نفره پارچه‌ای'), price: 48_000_000, description: 'قابل سفارشی‌سازی رنگ و پارچه' },
      { storeId: storeId['(نمونه) مبلمان آرا'], categoryId: catId['تولیدی‌ها و دست‌سازها/مبل'], name: 'مبل کلاسیک ۷ نفره چوب راش', normalizedName: normalizeFa('مبل کلاسیک ۷ نفره چوب راش'), price: 92_000_000 },
    ],
  })

  const counts = {
    admin: 1, cats: await prisma.category.count(), brands: await prisma.brand.count(),
    stores: await prisma.store.count(), products: await prisma.product.count(),
    offers: await prisma.offer.count(), storeItems: await prisma.storeItem.count(),
  }
  console.log('Seed OK:', JSON.stringify(counts))
}

main()
  .catch(e => { console.error('SEED ERROR:', e); process.exit(1) })
  .finally(() => prisma.$disconnect())
