# Margen Neto App (Sections 1–8)

Aplicación Next.js (App Router) + Supabase Auth + Supabase Postgres para calcular **margen neto real** cruzando:
- Ventas (Mercado Libre → `app.sales` + `app.sale_items`)
- Cobros (Mercado Pago → `app.payments`)
- Costos por SKU (COGS → `app.sku_costs`)
- Insumos + receta global (→ `app.supplies` + `app.supply_recipe_lines`)
- Métricas (`app.v_sale_margin`)

## Requisitos
- Node.js >= 20
- Proyecto Supabase configurado (URL + keys)
- Tokens de Mercado Libre/Mercado Pago (server-only)

## Setup local
1. Copiar env:
   - `cp .env.example .env.local`
2. Completar variables.
3. Instalar y correr:
   - `npm install`
   - `npm run dev`

## Variables de entorno
- **Públicas (browser-safe):**
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Servidor (secreto):**
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `ML_*` / `MP_*`

## Secciones implementadas
1. Base técnica + Auth (login/logout, layout, navegación).
2. Modelo de datos + DB layer (clients, helpers, validaciones).
3. Ventas (Sync ML + upsert idempotente + tabla).
4. Cobros (Sync MP + idempotente + tabla).
5. Costos por SKU (CRUD + bulk edit + export/import básico).
6. Insumos + receta global (CRUD + costo insumos por venta).
7. Métricas y margen neto (dashboard `app.v_sale_margin` + filtros + faltantes).
8. Hardening para producción (RLS recomendada, headers, rate limits, checklist Vercel).

## Producción / Hardening (Sección 8)
- Documentación: `docs/production.md`
- SQL recomendado: `supabase/hardening.sql`
- Se agregaron:
  - Security headers (CSP básica, XFO, nosniff, etc.)
  - Middleware reforzado para `/api/*` (401 en API, sin redirects)
  - Rate limiting simple por usuario y ruta (`lib/rateLimit.ts`)
  - Endpoint `/api/health`

## Build
- `npm run build`
