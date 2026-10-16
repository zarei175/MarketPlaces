// OTP فروشندگان: ارسال از کاوه‌نگار؛ در توسعه (OTP_MODE=console) فقط در لاگ سرور
// محدودیت ارسال: حداکثر ۳ کد در ۱۰ دقیقه برای هر موبایل (جلوگیری از هزینه/سوءاستفاده)

import { createHash, randomInt } from 'crypto'
import prisma from './prisma'

const TTL_MIN = 2
const MAX_ATTEMPTS = 5
const SEND_WINDOW_MIN = 10
const MAX_SENDS_PER_WINDOW = 3

function hashCode(mobile: string, code: string): string {
  return createHash('sha256').update(`${mobile}:${code}:${process.env.SESSION_SECRET ?? ''}`).digest('hex')
}

async function sendViaKavenegar(mobile: string, code: string): Promise<boolean> {
  const key = process.env.KAVENEGAR_API_KEY
  if (!key) return false
  try {
    const url = `https://api.kavenegar.com/v1/${key}/sms/send.json?receptor=${encodeURIComponent(mobile)}&message=${encodeURIComponent(`بازارمه\nکد ورود شما: ${code}`)}&sender=10004346`
    const res = await fetch(url, { signal: AbortSignal.timeout(10_000) })
    return res.ok
  } catch {
    return false
  }
}

export async function sendOtp(mobile: string): Promise<{ ok: boolean; error?: string }> {
  const normalized = mobile.replace(/[\s-]/g, '')
  if (!/^09\d{9}$/.test(normalized)) return { ok: false, error: 'شماره موبایل معتبر نیست (۰۹xxxxxxxxx)' }

  const windowStart = new Date(Date.now() - SEND_WINDOW_MIN * 60_000)
  const recent = await prisma.otpCode.count({ where: { mobile: normalized, createdAt: { gte: windowStart } } })
  if (recent >= MAX_SENDS_PER_WINDOW) return { ok: false, error: 'درخواست بیش از حد؛ چند دقیقه بعد تلاش کنید' }

  const code = String(randomInt(100_000, 1_000_000))
  await prisma.otpCode.create({
    data: { mobile: normalized, codeHash: hashCode(normalized, code), expiresAt: new Date(Date.now() + TTL_MIN * 60_000) },
  })

  if (process.env.OTP_MODE === 'console') {
    console.log(`[OTP] ${normalized} → کد: ${code} (ارسال واقعی غیرفعال — OTP_MODE=console)`)
    return { ok: true }
  }
  const sent = await sendViaKavenegar(normalized, code)
  return sent ? { ok: true } : { ok: false, error: 'ارسال پیامک ناموفق بود؛ دوباره تلاش کنید' }
}

export async function verifyOtp(mobile: string, code: string): Promise<boolean> {
  const normalized = mobile.replace(/[\s-]/g, '')
  const otp = await prisma.otpCode.findFirst({
    where: { mobile: normalized, consumedAt: null },
    orderBy: { createdAt: 'desc' },
  })
  if (!otp || otp.attempts >= MAX_ATTEMPTS) return false
  if (otp.expiresAt < new Date()) return false
  if (otp.codeHash !== hashCode(normalized, code)) {
    await prisma.otpCode.update({ where: { id: otp.id }, data: { attempts: { increment: 1 } } })
    return false
  }
  await prisma.otpCode.update({ where: { id: otp.id }, data: { consumedAt: new Date() } })
  return true
}
