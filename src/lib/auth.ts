// احراز هویت سبک و بدون وابستگی: pbkdf2 برای رمز، HMAC برای نشست کوکی
// دو نقش نشست: ادمین/اپراتور (پنل مدیریت) و فروشگاه (پنل فروشنده)

import { createHmac, pbkdf2Sync, randomBytes, timingSafeEqual } from 'crypto'
import { cookies } from 'next/headers'

const ITER = 100_000
const KEYLEN = 32
const SECRET = process.env.SESSION_SECRET || 'dev-secret-change-me'
const COOKIE = 'bzr_session'
const MAX_AGE = 60 * 60 * 24 * 14 // ۱۴ روز

export type Session =
  | { kind: 'admin'; id: number; username: string; role: 'ADMIN' | 'OPERATOR'; exp: number }
  | { kind: 'store'; id: number; storeId: number; mobile: string; role: string; exp: number }

// ─── رمز ───
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex')
  const hash = pbkdf2Sync(password, salt, ITER, KEYLEN, 'sha256').toString('hex')
  return `pbkdf2:${ITER}:${salt}:${hash}`
}

export function verifyPassword(password: string, stored: string): boolean {
  try {
    const [scheme, iterStr, salt, hash] = stored.split(':')
    if (scheme !== 'pbkdf2') return false
    const calc = pbkdf2Sync(password, salt, Number(iterStr), KEYLEN, 'sha256')
    const expected = Buffer.from(hash, 'hex')
    return calc.length === expected.length && timingSafeEqual(calc, expected)
  } catch {
    return false
  }
}

// ─── نشست (کوکی امضاشده) ───
function b64u(buf: Buffer | string): string {
  return Buffer.from(buf).toString('base64url')
}

function sign(payload: object): string {
  const body = b64u(JSON.stringify(payload))
  const mac = createHmac('sha256', SECRET).update(body).digest('base64url')
  return `${body}.${mac}`
}

function unsign(token: string): object | null {
  const [body, mac] = token.split('.')
  if (!body || !mac) return null
  const expect = createHmac('sha256', SECRET).update(body).digest('base64url')
  if (mac.length !== expect.length || !timingSafeEqual(Buffer.from(mac), Buffer.from(expect))) return null
  try {
    return JSON.parse(Buffer.from(body, 'base64url').toString('utf-8'))
  } catch {
    return null
  }
}

export async function setSession(payload: Omit<Extract<Session, { kind: 'admin' }>, 'exp'> | Omit<Extract<Session, { kind: 'store' }>, 'exp'>): Promise<void> {
  const jar = cookies()
  jar.set(COOKIE, sign({ ...payload, exp: Date.now() + MAX_AGE * 1000 }), {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE,
  })
}

export async function clearSession(): Promise<void> {
  cookies().set(COOKIE, '', { httpOnly: true, path: '/', maxAge: 0 })
}

/** خواندن و اعتبارسنجی نشست — در Server Component/Action/Route صدا زده می‌شود */
export function getSession(): Session | null {
  const token = cookies().get(COOKIE)?.value
  if (!token) return null
  const payload = unsign(token)
  if (!payload || typeof payload !== 'object') return null
  const s = payload as unknown as Session
  if (!s.exp || s.exp < Date.now()) return null
  if (s.kind !== 'admin' && s.kind !== 'store') return null
  return s
}

export function requireAdmin(role?: 'ADMIN'): Extract<Session, { kind: 'admin' }> | null {
  const s = getSession()
  if (!s || s.kind !== 'admin') return null
  if (role === 'ADMIN' && s.role !== 'ADMIN') return null
  return s
}

export function requireStore(): Extract<Session, { kind: 'store' }> | null {
  const s = getSession()
  return s && s.kind === 'store' ? s : null
}

// ─── موبایلِ در انتظار ثبت فروشگاه (بین OTP و فرم ثبت) ───
const PENDING_COOKIE = 'bzr_pending'
const PENDING_TTL_MS = 15 * 60 * 1000

export async function setPendingMobile(mobile: string): Promise<void> {
  cookies().set(PENDING_COOKIE, sign({ kind: 'pending', mobile, exp: Date.now() + PENDING_TTL_MS }), {
    httpOnly: true, sameSite: 'lax', path: '/', maxAge: PENDING_TTL_MS / 1000,
  })
}

export function getPendingMobile(): string | null {
  const token = cookies().get(PENDING_COOKIE)?.value
  if (!token) return null
  const p = unsign(token) as { kind?: string; mobile?: string; exp?: number } | null
  if (!p || p.kind !== 'pending' || !p.mobile || !p.exp || p.exp < Date.now()) return null
  return p.mobile
}

export async function clearPendingMobile(): Promise<void> {
  cookies().set(PENDING_COOKIE, '', { httpOnly: true, path: '/', maxAge: 0 })
}
