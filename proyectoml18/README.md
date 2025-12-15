# ML Margin App (MVP)

App web ultra simple para calcular **margen neto real** de facturación de Mercado Libre usando:
- Ventas (Mercado Libre) sincronizadas server-side
- Cobros (Mercado Pago) sincronizados server-side
- Costos manuales (COGS por SKU + receta global de insumos por venta)

## Setup local (SQLite)
```bash
npm install
cp .env.example .env
npx prisma migrate dev
npm run dev
```

## Deploy (Vercel / Postgres)

Este repo incluye schema y migraciones para Postgres en `prisma_pg/`.

1) En Vercel, crear/conectar una base Postgres (Vercel Postgres o Neon).
2) Configurar `DATABASE_URL` en **Production** y **Preview**.
3) Deploy. El build ejecuta automáticamente:
   - `prisma generate --schema prisma_pg/schema.prisma`
   - `next build`

Migraciones (recomendado ejecutarlas en tu pipeline/CLI):
```bash
npx prisma migrate deploy --schema prisma_pg/schema.prisma
```

Si `DATABASE_URL` no está configurada en Vercel, el build falla con un mensaje claro (preflight).

## Variables de entorno
- `DATABASE_URL`
- `ML_CLIENT_ID`, `ML_CLIENT_SECRET`, `ML_REFRESH_TOKEN`, `ML_SITE_ID`, `ML_SELLER_ID`
- `MP_ACCESS_TOKEN`

## Endpoints de sync
- POST `/api/sync/ml-sales`
- POST `/api/sync/mp-payments`

Body opcional:
- `{ "month": "YYYY-MM" }` o `{ "from": "YYYY-MM-DD", "to": "YYYY-MM-DD" }`

## Notas técnicas
Los campos exactos de ML/MP pueden variar por país/cuenta. El matching y cálculo están aislados en:
- `lib/integrations/mercadolibre.ts`
- `lib/integrations/mercadopago.ts`
