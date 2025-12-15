# Hardening y Producción (Sección 8)

## Principios
- **Anon key**: solo para Auth y lectura pública (si existiera).
- **Service Role key**: **solo servidor**. Nunca prefijar con `NEXT_PUBLIC_`, nunca usar en Client Components.
- **API protegida**: todas las rutas `app/api/*` validan sesión, y el middleware evita redirects en API (devuelve 401).

## RLS / Policies (Supabase)
Este proyecto usa un *Admin client* con `SUPABASE_SERVICE_ROLE_KEY` en el servidor, por lo que el acceso directo a DB desde el navegador no es necesario.

Recomendación (defense-in-depth):
1. **Habilitar RLS** en todas las tablas `app.*`
2. **Revocar permisos** a `anon` y `authenticated` sobre tablas/secuencias del schema `app`
3. Mantener el acceso real a través de:
   - Server Routes (`app/api/...`)
   - `lib/supabase/admin.ts` (server-only)

SQL listo: `supabase/hardening.sql`

## Rate limits (ML/MP)
Se incorporó un rate limiter simple por usuario y ruta (`lib/rateLimit.ts`).
- Sync ML/MP: burst 10, ~1 request cada 5s.
- CRUD: burst 60, ~1 request/s.

Si se requiere rate limiting estricto global, migrar a Redis/Upstash.

## Performance
- Paginación: usar `limit/offset` (máx 200 filas por vista).
- Evitar rangos largos sin filtros.
- Sync por defecto 30 días, usar rangos acotados.

## Seguridad operativa
- Rotar tokens ML/MP y `SUPABASE_SERVICE_ROLE_KEY` ante cualquier sospecha.
- No loggear secretos.

## Checklist deploy (Vercel)
1. Variables de entorno:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `ML_SITE_ID`, `ML_SELLER_ID`, `ML_CLIENT_ID`, `ML_CLIENT_SECRET`, `ML_REFRESH_TOKEN`
   - `MP_ACCESS_TOKEN`
2. Verificar que **ninguna** variable secreta tenga prefijo `NEXT_PUBLIC_`.
3. `npm install` + `npm run build`
4. Supabase:
   - Ejecutar `supabase/hardening.sql`
5. Smoke tests:
   - Login/logout
   - Sync Ventas / Sync Cobros
   - CRUD COGS, Insumos, Recetas
   - Métricas y margen (`app.v_sale_margin`)
