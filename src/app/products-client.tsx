"use client";

import { useState, useTransition } from 'react';

type Product = {
  id: number;
  name: string;
  description: string | null;
  price: number;
  createdAt: string | Date;
};

export default function ProductsClient({ initialProducts }: { initialProducts: Product[] }) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [isPending, startTransition] = useTransition();

  async function createProduct(e: React.FormEvent) {
    e.preventDefault();
    const body = {
      name: name.trim(),
      price: Number(price),
      description: description.trim() || undefined,
    };
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) return;
    const created = (await res.json()) as Product;
    setName('');
    setPrice('');
    setDescription('');
    startTransition(async () => {
      const list = await fetch('/api/products').then(r => r.json());
      setProducts(list);
    });
  }

  return (
    <section style={{ display: 'grid', gap: 16 }}>
      <form onSubmit={createProduct} style={{ display: 'grid', gap: 8, maxWidth: 420 }}>
        <input placeholder="نام محصول" value={name} onChange={e => setName(e.target.value)} required />
        <input placeholder="قیمت (تومان)" value={price} onChange={e => setPrice(e.target.value)} type="number" required />
        <input placeholder="توضیحات" value={description} onChange={e => setDescription(e.target.value)} />
        <button type="submit" disabled={isPending || !name || !price}>ثبت محصول</button>
      </form>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 8 }}>
        {products.length === 0 && <li>محصولی وجود ندارد.</li>}
        {products.map(p => (
          <li key={p.id} style={{ background: '#111827', padding: 12, borderRadius: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <strong>{p.name}</strong>
              <span>{p.price.toLocaleString('fa-IR')} تومان</span>
            </div>
            {p.description && <div style={{ opacity: 0.85 }}>{p.description}</div>}
          </li>
        ))}
      </ul>
    </section>
  );
}





