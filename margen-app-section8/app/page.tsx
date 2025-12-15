import { requireUser } from "@/lib/auth";

export default async function HomePage() {
  const user = await requireUser();

  return (
    <main className="grid2">
      <section className="card">
        <div className="h1">Inicio</div>
        <div className="h2">Sesión activa</div>
        <p className="small">
          Usuario: <strong>{user.email ?? user.id}</strong>
        </p>
        <p className="small">
          Este es el hito 1 (Base + Auth). En el próximo ZIP agregamos DB layer y luego Sync de Ventas/Cobros.
        </p>
      </section>

      <section className="card">
        <div className="h1">Estado del proyecto</div>
        <ul>
          <li>Next.js App Router</li>
          <li>Supabase Auth (login / signup / logout)</li>
          <li>Middleware de protección (rutas privadas)</li>
        </ul>
        <p className="small">
          Si al loguearte vuelve a /login, revisá que en Supabase esté habilitado Email/Password y que las env vars
          estén bien en Vercel (Production/Preview/Development).
        </p>
      </section>
    </main>
  );
}
