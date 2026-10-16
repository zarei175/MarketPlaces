// پنل فروشنده — «ویرایش سریع قیمت» قلب تازگی داده است (نسخه ۲ بخش ۸.۳)

'use server';

import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { requireStore, clearSession } from '@/lib/auth';
import { normalizeFa } from '@/lib/fa';
import { randomInt } from 'crypto';

async function guard() {
  const s = requireStore();
  if (!s) redirect('/vendor/login');
  return s;
}

async function audit(storeId: number, action: string, entity: string, entityId: number, detail: string) {
  await prisma.auditLog.create({ data: { actorType: 'STORE', actorRef: String(storeId), action, entity, entityId, detail } }).catch(() => {});
}

export async function vendorUpdateOfferAction(fd: FormData) {
  const s = await guard();
  const id = Number(fd.get('id'));
  const price = Math.max(0, Math.floor(Number(fd.get('price') || 0)));
  const availability = String(fd.get('availability') ?? 'IN_STOCK') as 'IN_STOCK' | 'OUT_OF_STOCK' | 'CALL';
  if (!id || !price) redirect('/vendor?e=قیمت نامعتبر');

  const offer = await prisma.offer.findUnique({ where: { id }, include: { store: { select: { id: true } } } });
  if (!offer || offer.store.id !== s.storeId) redirect('/vendor?e=اجازه ندارید');

  if (offer.price !== price || offer.availability !== availability) {
    await prisma.offer.update({ where: { id }, data: { price, availability, source: 'PANEL', lastConfirmedAt: new Date() } });
    await prisma.priceHistory.create({ data: { offerId: id, price, availability } });
    await audit(s.storeId, 'UPDATE', 'Offer', id, String(price));
  } else {
    await prisma.offer.update({ where: { id }, data: { lastConfirmedAt: new Date() } });
  }
  redirect('/vendor?ok=1');
}

export async function vendorConfirmAllAction() {
  const s = await guard();
  await prisma.offer.updateMany({ where: { storeId: s.storeId }, data: { lastConfirmedAt: new Date() } });
  await audit(s.storeId, 'CONFIRM-ALL', 'Store', s.storeId, '');
  redirect('/vendor?ok=confirmed');
}

/** افزودن قیمت برای کالای موجود کاتالوگ (روش «انتخاب از کاتالوگ مرکزی») */
export async function vendorAddOfferAction(fd: FormData) {
  const s = await guard();
  const productId = Number(fd.get('productId'));
  const price = Math.max(0, Math.floor(Number(fd.get('price') || 0)));
  if (!productId || !price) redirect('/vendor?e=کالا و قیمت الزامی است');
  const availability = String(fd.get('availability') ?? 'IN_STOCK') as 'IN_STOCK' | 'OUT_OF_STOCK' | 'CALL';

  const existing = await prisma.offer.findUnique({ where: { productId_storeId: { productId, storeId: s.storeId } } });
  if (existing) {
    await prisma.offer.update({ where: { id: existing.id }, data: { price, availability, source: 'PANEL', lastConfirmedAt: new Date() } });
    await prisma.priceHistory.create({ data: { offerId: existing.id, price, availability } });
  } else {
    const offer = await prisma.offer.create({ data: { productId, storeId: s.storeId, price, availability, source: 'PANEL' } });
    await prisma.priceHistory.create({ data: { offerId: offer.id, price, availability } });
  }
  redirect('/vendor?ok=1');
}

/** ساخت کالای جدید + قیمت آن در یک قدم */
export async function vendorCreateProductAction(fd: FormData) {
  const s = await guard();
  const name = String(fd.get('name') ?? '').trim();
  const price = Math.max(0, Math.floor(Number(fd.get('price') || 0)));
  const categoryId = Number(fd.get('categoryId'));
  const brandId = fd.get('brandId') ? Number(fd.get('brandId')) : null;
  if (!name || !price || !categoryId) redirect('/vendor?e=نام، دسته و قیمت الزامی است');

  let slug = normalizeFa(name).replace(/[^a-z0-9\u0600-\u06FF ]/g, '').replace(/\s+/g, '-').slice(0, 80);
  if (!slug || await prisma.product.findFirst({ where: { slug } })) slug = `${slug || 'kala'}-${randomInt(1000, 9999)}`;

  const product = await prisma.product.create({
    data: { name, normalizedName: normalizeFa(name), slug, categoryId, brandId, status: 'ACTIVE' },
  });
  const offer = await prisma.offer.create({
    data: { productId: product.id, storeId: s.storeId, price, source: 'PANEL' },
  });
  await prisma.priceHistory.create({ data: { offerId: offer.id, price, availability: 'IN_STOCK' } });
  redirect('/vendor?ok=1');
}

/** افزودن محصول تولیدی (کالای غیراستاندارد) */
export async function vendorAddStoreItemAction(fd: FormData) {
  const s = await guard();
  const name = String(fd.get('name') ?? '').trim();
  const price = Math.max(0, Math.floor(Number(fd.get('price') || 0)));
  const categoryId = Number(fd.get('categoryId'));
  if (!name || !price || !categoryId) redirect('/vendor?e=همه فیلدها الزامی است');
  const item = await prisma.storeItem.create({
    data: {
      storeId: s.storeId,
      categoryId,
      name,
      normalizedName: normalizeFa(name),
      price,
      availability: String(fd.get('availability') ?? 'IN_STOCK') as 'IN_STOCK' | 'OUT_OF_STOCK' | 'CALL',
    },
  });
  await audit(s.storeId, 'CREATE', 'StoreItem', item.id, name);
  redirect('/vendor?ok=1');
}

export async function vendorLogoutAction() {
  await clearSession();
  redirect('/vendor/login');
}
