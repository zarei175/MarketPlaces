// قوانین تازگی قیمت (طرح نسخه ۲، بخش ۵.۲):
//  - زیر ۱۴ روز: کامل و فعال در مقایسه
//  - ۱۴ تا ۳۰ روز: کم‌رنگ + «تماس بگیرید» (کالا می‌ماند، مقایسه قیمت نه)
//  - بیش از ۳۰ روز: از جدول مقایسه حذف می‌شود
// در دوره‌های تورمی شدید از پنل مدیر کوتاه‌تر می‌شود (Setting — فاز بعد).

export const FRESH_DAYS = 14
export const STALE_DAYS = 30

export type Freshness = 'fresh' | 'aging' | 'stale'

export function freshnessOf(lastConfirmedAt: Date | string, now = new Date()): Freshness {
  const days = (now.getTime() - new Date(lastConfirmedAt).getTime()) / 86_400_000
  if (days < FRESH_DAYS) return 'fresh'
  if (days < STALE_DAYS) return 'aging'
  return 'stale'
}

export const AVAILABILITY_FA: Record<string, string> = {
  IN_STOCK: 'موجود',
  OUT_OF_STOCK: 'ناموجود',
  CALL: 'تماس بگیرید',
}
