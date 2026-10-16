import prisma from '@/lib/prisma';
import ProductsClient from './products-client';

export default async function HomePage() {
  const products = await prisma.product.findMany({ orderBy: { createdAt: 'desc' } });
  return (
    <main style={{ padding: 24, display: 'grid', gap: 16 }}>
      <h1>بازارهای ماهشهر</h1>
      <ProductsClient initialProducts={products} />
    </main>
  );
}


