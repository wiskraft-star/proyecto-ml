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
Este repo trae un schema y migraciones **separadas** para Postgres en `prisma_pg/`.

Nota: el proyecto ejecuta `prisma generate` automáticamente en `postinstall` y antes de `next build`,
eligiendo el schema según el protocolo de `DATABASE_URL` (sqlite => `prisma/`, postgres => `prisma_pg/`).

1) En Vercel, configurar `DATABASE_URL` a Postgres (Vercel Postgres / Neon).
2) Ejecutar migraciones en build/deploy (o en tu pipeline) con:
```bash
npx prisma generate --schema prisma_pg/schema.prisma
npx prisma migrate deploy --schema prisma_pg/schema.prisma
```
3) Build:
```bash
npm run build
```

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
