// همه اکشن‌های پنل مدیریت — «ورود داده» قلب عملیات روزانه اپراتور است (نسخه ۲ بخش ۵.۱)
// هر تغییر مهم در AuditLog ثبت می‌شود (بخش ۹.۴).

'use server';

import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { requireAdmin, clearSession } from '@/lib/auth';
import { normalizeFa, slugifyFa } from '@/lib/fa';

async function guard() {
  const s = requireAdmin();
  if (!s) redirect('/login');
  return s;
}

async function audit(actor: string, actorRef: string, action: string, entity: string, entityId?: number, detail?: string) {
  await prisma.auditLog.create({
    data: { actorType: actor, actorRef, action, entity, entityId, detail },
  }).catch(() => {});
}

/** اسلاگ یکتا: اگر تکراری بود شماره اضافه می‌کند */
async function uniqueSlug(kind: 'store' | 'product' | 'category' | 'brand', base: string, ignoreId?: number): Promise<string> {
  const slug = slugifyFa(base) || 'item';
  for (let i = 0; i < 50; i++) {
    const candidate = i === 0 ? slug : `${slug}-${i + 1}`;
    const taken =
      kind === 'store' ? await prisma.store.findFirst({ where: { slug: candidate }, select: { id: true } })
      : kind === 'product' ? await prisma.product.findFirst({ where: { slug: candidate }, select: { id: true } })
      : kind === 'category' ? await prisma.category.findFirst({ where: { slug: candidate }, select: { id: true } })
      : await prisma.brand.findFirst({ where: { slug: candidate }, select: { id: true } });
    if (!taken || taken.id === ignoreId) return candidate;
  }
  return `${slug}-${Date.now()}`;
}

// ─── خروج ───
export async function loginOutAction() {
  await clearSession();
  redirect('/login');
}

// ─── فروشگاه‌ها ───
export async function createStoreAction(fd: FormData) {
  const s = await guard();
  const name = String(fd.get('name') ?? '').trim();
  const phone = String(fd.get('phone') ?? '').trim();
  if (!name || !phone) redirect('/admin/stores?e=نام و تلفن الزامی است');

  const store = await prisma.store.create({
    data: {
      name,
      slug: await uniqueSlug('store', name),
      phone,
      categoryName: String(fd.get('categoryName') ?? '').trim() || null,
      address: String(fd.get('address') ?? '').trim(),
      city: String(fd.get('city') ?? 'بندر ماهشهر'),
      lat: fd.get('lat') ? Number(fd.get('lat')) : null,
      lng: fd.get('lng') ? Number(fd.get('lng')) : null,
      workingHours: String(fd.get('workingHours') ?? '').trim() || null,
      status: 'ACTIVE',
    },
  });
  await audit(s.role, s.username, 'CREATE', 'Store', store.id, name);
  redirect(`/admin/stores/${store.id}?ok=1`);
}

export async function updateStoreAction(fd: FormData) {
  const s = await guard();
  const id = Number(fd.get('id'));
  const name = String(fd.get('name') ?? '').trim();
  if (!id || !name) redirect('/admin/stores?e=خطا در داده');
  await prisma.store.update({
    where: { id },
    data: {
      name,
      phone: String(fd.get('phone') ?? '').trim(),
      categoryName: String(fd.get('categoryName') ?? '').trim() || null,
      address: String(fd.get('address') ?? '').trim(),
      city: String(fd.get('city') ?? 'بندر ماهشهر'),
      lat: fd.get('lat') ? Number(fd.get('lat')) : null,
      lng: fd.get('lng') ? Number(fd.get('lng')) : null,
      workingHours: String(fd.get('workingHours') ?? '').trim() || null,
      description: String(fd.get('description') ?? '').trim() || null,
      founder: fd.get('founder') === 'on',
    },
  });
  await audit(s.role, s.username, 'UPDATE', 'Store', id, name);
  redirect(`/admin/stores/${id}?ok=1`);
}

export async function setStoreStatusAction(fd: FormData) {
  const s = await guard();
  const id = Number(fd.get('id'));
  const status = String(fd.get('status') ?? '') as 'PENDING' | 'ACTIVE' | 'SUSPENDED';
  if (id && ['PENDING', 'ACTIVE', 'SUSPENDED'].includes(status)) {
    await prisma.store.update({ where: { id }, data: { status } });
    await audit(s.role, s.username, 'STATUS', 'Store', id, status);
  }
  redirect('/admin/stores');
}

export async function deleteStoreAction(fd: FormData) {
  const s = await guard();
  const id = Number(fd.get('id'));
  if (id) {
    await prisma.leadEvent.deleteMany({ where: { storeId: id } });
    await prisma.offer.deleteMany({ where: { storeId: id } });
    await prisma.storeItem.deleteMany({ where: { storeId: id } });
    await prisma.storeUser.deleteMany({ where: { storeId: id } });
    await prisma.store.delete({ where: { id } });
    await audit(s.role, s.username, 'DELETE', 'Store', id);
  }
  redirect('/admin/stores');
}

// ─── کالاها ───
export async function createProductAction(fd: FormData) {
  const s = await guard();
  const name = String(fd.get('name') ?? '').trim();
  const categoryId = Number(fd.get('categoryId'));
  if (!name || !categoryId) redirect('/admin/products?e=نام و دسته الزامی است');
  const brandId = fd.get('brandId') ? Number(fd.get('brandId')) : null;
  const product = await prisma.product.create({
    data: {
      name,
      normalizedName: normalizeFa(name),
      slug: await uniqueSlug('product', name),
      categoryId,
      brandId,
      status: 'ACTIVE',
    },
  });
  await audit(s.role, s.username, 'CREATE', 'Product', product.id, name);
  redirect('/admin/products?ok=1');
}

export async function deleteProductAction(fd: FormData) {
  const s = await guard();
  const id = Number(fd.get('id'));
  if (id) {
    await prisma.offer.deleteMany({ where: { productId: id } });
    await prisma.product.delete({ where: { id } });
    await audit(s.role, s.username, 'DELETE', 'Product', id);
  }
  redirect('/admin/products');
}

// ─── قیمت‌ها (Offer) ───
export async function upsertOfferAction(fd: FormData) {
  const s = await guard();
  const productId = Number(fd.get('productId'));
  const storeId = Number(fd.get('storeId'));
  const price = Math.max(0, Math.floor(Number(fd.get('price') || 0)));
  const availability = String(fd.get('availability') ?? 'IN_STOCK') as 'IN_STOCK' | 'OUT_OF_STOCK' | 'CALL';
  if (!productId || !storeId || !price) redirect('/admin/offers?e=کالا، فروشگاه و قیمت الزامی است');
  const note = String(fd.get('note') ?? '').trim() || null;

  const existing = await prisma.offer.findUnique({ where: { productId_storeId: { productId, storeId } } });
  if (existing) {
    if (existing.price !== price || existing.availability !== availability) {
      await prisma.offer.update({
        where: { id: existing.id },
        data: { price, availability, note, source: 'OPERATOR', lastConfirmedAt: new Date() },
      });
      await prisma.priceHistory.create({ data: { offerId: existing.id, price, availability } });
      await audit(s.role, s.username, 'UPDATE', 'Offer', existing.id, `${price}`);
    } else {
      await prisma.offer.update({ where: { id: existing.id }, data: { note, lastConfirmedAt: new Date() } });
    }
  } else {
    const offer = await prisma.offer.create({
      data: { productId, storeId, price, availability, note, source: 'OPERATOR' },
    });
    await prisma.priceHistory.create({ data: { offerId: offer.id, price, availability } });
    await audit(s.role, s.username, 'CREATE', 'Offer', offer.id, `${price}`);
  }
  redirect('/admin/offers?ok=1');
}

export async function quickUpdateOfferAction(fd: FormData) {
  const s = await guard();
  const id = Number(fd.get('id'));
  const price = Math.max(0, Math.floor(Number(fd.get('price') || 0)));
  const availability = String(fd.get('availability') ?? 'IN_STOCK') as 'IN_STOCK' | 'OUT_OF_STOCK' | 'CALL';
  if (!id || !price) redirect('/admin/offers?e=قیمت نامعتبر');
  const existing = await prisma.offer.findUnique({ where: { id } });
  if (existing) {
    if (existing.price !== price || existing.availability !== availability) {
      await prisma.offer.update({ where: { id }, data: { price, availability, source: 'OPERATOR', lastConfirmedAt: new Date() } });
      await prisma.priceHistory.create({ data: { offerId: id, price, availability } });
      await audit(s.role, s.username, 'QUICK-UPDATE', 'Offer', id, `${price}`);
    } else {
      await prisma.offer.update({ where: { id }, data: { lastConfirmedAt: new Date() } });
    }
  }
  const back = String(fd.get('back') ?? '/admin/offers');
  redirect(back);
}

export async function confirmOfferAction(fd: FormData) {
  const s = await guard();
  const id = Number(fd.get('id'));
  if (id) {
    await prisma.offer.update({ where: { id }, data: { lastConfirmedAt: new Date() } });
    await audit(s.role, s.username, 'CONFIRM', 'Offer', id);
  }
  redirect(String(fd.get('back') ?? '/admin/offers'));
}

export async function confirmStoreOffersAction(fd: FormData) {
  const s = await guard();
  const storeId = Number(fd.get('storeId'));
  if (storeId) {
    const r = await prisma.offer.updateMany({ where: { storeId }, data: { lastConfirmedAt: new Date() } });
    await audit(s.role, s.username, 'CONFIRM-ALL', 'Store', storeId, `${r.count} قیمت`);
  }
  redirect(`/admin/stores/${storeId}?ok=confirmed`);
}

export async function deleteOfferAction(fd: FormData) {
  const s = await guard();
  const id = Number(fd.get('id'));
  if (id) {
    await prisma.offer.delete({ where: { id } });
    await audit(s.role, s.username, 'DELETE', 'Offer', id);
  }
  redirect('/admin/offers');
}

// ─── دسته‌ها و برندها ───
export async function createCategoryAction(fd: FormData) {
  const s = await guard();
  const name = String(fd.get('name') ?? '').trim();
  if (!name) redirect('/admin/taxonomy?e=نام الزامی است');
  const kind = String(fd.get('kind') ?? 'STANDARD') === 'CUSTOM' ? 'CUSTOM' : 'STANDARD';
  const parentId = fd.get('parentId') ? Number(fd.get('parentId')) : null;
  const category = await prisma.category.create({
    data: { name, slug: await uniqueSlug('category', name), kind, parentId, icon: String(fd.get('icon') ?? '').trim() || null },
  });
  await audit(s.role, s.username, 'CREATE', 'Category', category.id, name);
  redirect('/admin/taxonomy?ok=1');
}

export async function deleteCategoryAction(fd: FormData) {
  const s = await guard();
  const id = Number(fd.get('id'));
  if (!id) redirect('/admin/taxonomy');
  const [pc, ic, cc] = await Promise.all([
    prisma.product.count({ where: { categoryId: id } }),
    prisma.storeItem.count({ where: { categoryId: id } }),
    prisma.category.count({ where: { parentId: id } }),
  ]);
  if (pc + ic + cc > 0) redirect('/admin/taxonomy?e=دسته خالی نیست؛ اول محتوایش را جابه‌جا یا حذف کنید');
  await prisma.category.delete({ where: { id } });
  await audit(s.role, s.username, 'DELETE', 'Category', id);
  redirect('/admin/taxonomy');
}

export async function createBrandAction(fd: FormData) {
  const s = await guard();
  const name = String(fd.get('name') ?? '').trim();
  if (!name) redirect('/admin/taxonomy?e=نام الزامی است');
  const brand = await prisma.brand.create({ data: { name, slug: await uniqueSlug('brand', name) } });
  await audit(s.role, s.username, 'CREATE', 'Brand', brand.id, name);
  redirect('/admin/taxonomy?ok=1');
}

export async function deleteBrandAction(fd: FormData) {
  const s = await guard();
  const id = Number(fd.get('id'));
  if (id) {
    await prisma.brand.delete({ where: { id } });
    await audit(s.role, s.username, 'DELETE', 'Brand', id);
  }
  redirect('/admin/taxonomy');
}

// ─── تولیدی‌ها (StoreItem) ───
export async function createStoreItemAction(fd: FormData) {
  const s = await guard();
  const storeId = Number(fd.get('storeId'));
  const categoryId = Number(fd.get('categoryId'));
  const name = String(fd.get('name') ?? '').trim();
  const price = Math.max(0, Math.floor(Number(fd.get('price') || 0)));
  if (!storeId || !categoryId || !name || !price) redirect('/admin/store-items?e=همه فیلدها الزامی است');
  const item = await prisma.storeItem.create({
    data: {
      storeId,
      categoryId,
      name,
      normalizedName: normalizeFa(name),
      price,
      availability: String(fd.get('availability') ?? 'IN_STOCK') as 'IN_STOCK' | 'OUT_OF_STOCK' | 'CALL',
      description: String(fd.get('description') ?? '').trim() || null,
    },
  });
  await audit(s.role, s.username, 'CREATE', 'StoreItem', item.id, name);
  redirect('/admin/store-items?ok=1');
}

export async function deleteStoreItemAction(fd: FormData) {
  const s = await guard();
  const id = Number(fd.get('id'));
  if (id) {
    await prisma.storeItem.delete({ where: { id } });
    await audit(s.role, s.username, 'DELETE', 'StoreItem', id);
  }
  redirect('/admin/store-items');
}

// ─── گزارش‌های خطا ───
export async function resolveIssueAction(fd: FormData) {
  const s = await guard();
  const id = Number(fd.get('id'));
  if (id) {
    await prisma.issueReport.update({ where: { id }, data: { status: 'RESOLVED', resolvedAt: new Date() } });
    await audit(s.role, s.username, 'RESOLVE', 'IssueReport', id);
  }
  redirect('/admin/issues');
}
