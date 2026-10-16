// ابزارهای فارسی: نرمال‌سازی، اعداد، مترادف‌ها، اسلاگ — هسته جستجوی فارسی (طرح نسخه ۲، بخش ۸.۵)

const ARABIC_TO_PERSIAN: Array<[RegExp, string]> = [
  [/ي/g, 'ی'],
  [/ك/g, 'ک'],
  [/ة/g, 'ه'],
  [/[أإآ]/g, 'ا'],
  [/ؤ/g, 'و'],
  [/ئ/g, 'ی'],
  [/ٱ/g, 'ا'],
]

const DIACRITICS = /[\u064B-\u0652\u0670\u0640]/g // اعراب و کشیده
const FA_DIGITS = /[\u06F0-\u06F9\u0660-\u0669]/g
const FA_TO_EN: Record<string, string> = {
  '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4', '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9',
  '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4', '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9',
}

/** یکسان‌سازی نگارش فارسی/عربی + اعداد + فاصله‌ها — برای ذخیره normalizedName و جستجو */
export function normalizeFa(input: string): string {
  let s = input
  for (const [re, rep] of ARABIC_TO_PERSIAN) s = s.replace(re, rep)
  s = s.replace(DIACRITICS, '')
  s = s.replace(FA_DIGITS, d => FA_TO_EN[d] ?? d)
  s = s.replace(/[\u200c\u200f\u200e]/g, ' ') // نیم‌فاصله و علائم RTL → فاصله
  s = s.replace(/[«»"'()\[\]{};:,!.?؟،؛]/g, ' ')
  s = s.replace(/\s+/g, ' ').trim()
  return s.toLowerCase()
}

/** مترادف‌های رایج ماهشهر — جستجوی هر معادل، بقیه را هم می‌گیرد (بخش ۸.۵) */
const SYNONYM_GROUPS: string[][] = [
  ['کولر گازی', 'اسپلیت', 'کولر آبی اسپلیت'],
  ['یخچال فریزر', 'ساید', 'ساید بای ساید'],
  ['گوشی', 'موبایل', 'تلفن همراه', 'ایفون'],
  ['تلویزیون', 'تی وی', 'tv'],
  ['لباسشویی', 'ماشین لباسشویی', 'واترپاش'],
  ['ظرفشویی', 'ماشین ظرفشویی'],
  ['جاروبرقی', 'جارو'],
  ['پاوربانک', 'power bank', 'شارژر همراه'],
  ['لوازم جانبی', 'اکسسوری'],
  ['دریل', 'دريل', 'مته زن'],
  ['مینی فرز', 'مینیفرز', 'انگشتی'],
  ['قهوه ساز', 'کافه میکر', 'اسپرسوساز'],
]

/** بسط پرس‌وجو به همه معادل‌ها */
export function expandQuery(query: string): string[] {
  const norm = normalizeFa(query)
  if (!norm) return []
  const terms = new Set<string>([norm])
  for (const group of SYNONYM_GROUPS) {
    const normalizedGroup = group.map(normalizeFa)
    if (normalizedGroup.some(g => norm.includes(g))) {
      for (const g of normalizedGroup) terms.add(g)
    }
  }
  return [...terms]
}

/** عدد با جداکننده هزارگان و رقم فارسی */
export function formatToman(value: number): string {
  return `${(value).toLocaleString('fa-IR')} تومان`
}

export function formatNumber(value: number): string {
  return value.toLocaleString('fa-IR')
}

/** فاصله زمانی خوانا: «به‌روز»، «۳ روز پیش»… */
export function timeAgoFa(date: Date, now = new Date()): string {
  const days = Math.floor((now.getTime() - new Date(date).getTime()) / 86_400_000)
  if (days <= 0) return 'امروز به‌روز شده'
  if (days === 1) return 'دیروز به‌روز شده'
  if (days === 7) return 'هفته پیش به‌روز شده'
  return `${formatNumber(days)} روز پیش به‌روز شده`
}

/** اسلاگ امن برای فارسی (برای URL تمیز سئو) */
export function slugifyFa(input: string): string {
  return normalizeFa(input)
    .replace(/[^a-z0-9\u0600-\u06FF -]/g, '') // خط تیره می‌ماند
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80)
}

export const CITIES = ['بندر ماهشهر', 'بندر امام خمینی', 'چمران'] as const
