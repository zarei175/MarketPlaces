// دسته‌ها (درخت) و برندها

import prisma from '@/lib/prisma';
import { createCategoryAction, deleteCategoryAction, createBrandAction, deleteBrandAction } from '../actions';

export const dynamic = 'force-dynamic';

export default async function TaxonomyPage({ searchParams }: { searchParams: { e?: string; ok?: string } }) {
  const [roots, brands] = await Promise.all([
    prisma.category.findMany({
      where: { parentId: null },
      orderBy: { sortOrder: 'asc' },
      include: { children: true },
    }),
    prisma.brand.findMany({ include: { _count: { select: { products: true } } }, orderBy: { name: 'asc' } }),
  ]);
  const allForSelect = await prisma.category.findMany({ orderBy: { parentId: 'asc' } });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-lg font-extrabold">دسته‌ها و برندها</h1>
      {searchParams.e && <p className="rounded-lg bg-red-50 p-2 text-xs text-red-600">{searchParams.e}</p>}

      <section className="flex flex-col gap-4 lg:flex-row">
        <div className="card flex-1 p-4">
          <h2 className="mb-3 text-sm font-bold">دسته‌ها</h2>
          <form action={createCategoryAction} className="mb-4 grid grid-cols-2 gap-2 text-sm">
            <input name="name" className="input" placeholder="نام دسته جدید" required />
            <select name="parentId" className="input">
              <option value="">— دسته والد —</option>
              {allForSelect.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select name="kind" className="input">
              <option value="STANDARD">استاندارد (کاتالوگی)</option>
              <option value="CUSTOM">غیراستاندارد (تولیدی)</option>
            </select>
            <div className="flex gap-2">
              <input name="icon" className="input" placeholder="آیکون 🛍️" />
              <button className="btn-primary shrink-0">افزودن</button>
            </div>
          </form>
          <div className="flex flex-col gap-2 text-sm">
            {roots.map(r => (
              <div key={r.id} className="rounded-lg border border-stone-200 p-2">
                <div className="flex items-center justify-between">
                  <p className="font-semibold">{r.icon} {r.name} {r.kind === 'CUSTOM' && <span className="badge bg-violet-100 text-violet-700">تولیدی</span>}</p>
                  <form action={deleteCategoryAction}>
                    <input type="hidden" name="id" value={r.id} />
                    <button className="text-[11px] text-red-400 hover:text-red-600">حذف</button>
                  </form>
                </div>
                {r.children.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-2 border-t border-stone-100 pt-1">
                    {r.children.map(c => (
                      <span key={c.id} className="flex items-center gap-1 rounded-full bg-stone-100 px-2 py-0.5 text-xs">
                        {c.name}
                        <form action={deleteCategoryAction}>
                          <input type="hidden" name="id" value={c.id} />
                          <button className="text-stone-400 hover:text-red-500">×</button>
                        </form>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="card w-full p-4 lg:w-72">
          <h2 className="mb-3 text-sm font-bold">برندها</h2>
          <form action={createBrandAction} className="mb-3 flex gap-2 text-sm">
            <input name="name" className="input" placeholder="نام برند" required />
            <button className="btn-primary shrink-0">+</button>
          </form>
          <div className="flex flex-wrap gap-2">
            {brands.map(b => (
              <span key={b.id} className="flex items-center gap-1 rounded-full bg-stone-100 px-2 py-1 text-xs">
                {b.name} <span className="num text-stone-400">({b._count.products})</span>
                <form action={deleteBrandAction}>
                  <input type="hidden" name="id" value={b.id} />
                  <button className="text-stone-400 hover:text-red-500">×</button>
                </form>
              </span>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
