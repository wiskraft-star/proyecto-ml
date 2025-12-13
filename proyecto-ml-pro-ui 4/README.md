# PROYECTO ML — UI PRO (Demo)

Este proyecto es una **UI PRO** (modo demo) para un integrador / panel de control de Mercado Libre.

Incluye:
- Sidebar colapsable + topbar
- Command palette (⌘K / Ctrl+K)
- Dashboard con KPIs, acciones, gráficos y drill-down (drawer)
- Secciones: Ventas, Rentabilidad, Gastos, Stock, Postventa, Publicaciones, Reportes, Integraciones, Parámetros
- Datos mock (demo) listos para reemplazar por Supabase

## Ejecutar local

```bash
npm install
npm run dev
```

Abrir http://localhost:3000

## Deploy en Vercel

1) Importar repo en Vercel
2) Si el proyecto está en subcarpeta, setear **Root Directory** en Vercel.
3) Variables (opcional, solo para ver estado en Integraciones):
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY

## Próximas fases (cuando conectemos datos reales)
- Supabase schema + views para KPIs/P&L
- Jobs server-side para sincronizar ML/MP
- Auditoría real por orden/movimiento
