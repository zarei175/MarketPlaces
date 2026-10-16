import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  const products = await prisma.product.findMany({ orderBy: { createdAt: 'desc' } });
  return NextResponse.json(products);
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body.name !== 'string' || typeof body.price !== 'number') {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }
  const created = await prisma.product.create({
    data: {
      name: body.name,
      price: Math.max(0, Math.floor(body.price)),
      description: typeof body.description === 'string' ? body.description : null,
    },
  });
  return NextResponse.json(created, { status: 201 });
}


