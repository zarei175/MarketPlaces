Mahshahr Marketplaces
=====================

Quick start
-----------

1. Copy environment example:

```bash
cp .env.example .env
```

2. Install dependencies:

```bash
npm install
```

3. Prepare the database and Prisma client:

```bash
npm run db:push && npm run prisma:generate
```

4. Run the dev server:

```bash
npm run dev
```

Open http://localhost:3000

API
---

- `GET /api/products` — list products
- `POST /api/products` — create product `{ name: string, price: number, description?: string }`

Notes
-----

- Uses SQLite via Prisma. DB file is created in `prisma/dev.db`.
- Default locale is Persian (RTL) in `src/app/layout.tsx`.


