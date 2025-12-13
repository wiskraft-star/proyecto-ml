# PROYECTO ML — UI PRO (fase 1)

Este proyecto es un esqueleto profesional de interfaz (Next.js App Router + Tailwind) para tu panel.

## 1) Cómo correr local
1. Copiá `.env.example` a `.env.local` y completá tus variables.
2. Instalá dependencias:
   - `npm install`
3. Ejecutá:
   - `npm run dev`

## 2) Deploy en Vercel
- Importá el repo en Vercel.
- En **Settings → Environment Variables** cargá:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Redeploy.

## 3) Qué sigue
Cuando confirmes que esta estética te gusta, conectamos datos desde Supabase:
- vistas para ventas / gastos / stock
- métricas netas (tu “calculadora real de ganancia”)
deploy trigger
