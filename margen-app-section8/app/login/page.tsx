"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type Mode = "login" | "signup";

export default function LoginPage() {
  const router = useRouter();
  const search = useSearchParams();
  const nextPath = useMemo(() => search.get("next") ?? "/", [search]);

  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);

    try {
      const supabase = createSupabaseBrowserClient();

      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push(nextPath);
        router.refresh();
        return;
      }

      const { error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;

      // Some projects require email confirmation. Even if so, we show a message.
      setMsg("Cuenta creada. Si tu proyecto requiere confirmación por email, revisá tu correo y luego iniciá sesión.");
      setMode("login");
    } catch (err: any) {
      setMsg(err?.message ?? "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid2">
      <section className="card">
        <div className="h1">{mode === "login" ? "Iniciar sesión" : "Crear cuenta"}</div>
        <p className="small">
          Usamos Supabase Auth. Para producción, asegurate de tener configurado el dominio en Supabase Auth settings.
        </p>

        <form onSubmit={submit} style={{ marginTop: 12 }}>
          <div style={{ marginBottom: 12 }}>
            <label className="label">Email</label>
            <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>

          <div style={{ marginBottom: 12 }}>
            <label className="label">Password</label>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          {msg ? (
            <div className="card" style={{ borderRadius: 12, padding: 12, marginBottom: 12 }}>
              <div className="small">{msg}</div>
            </div>
          ) : null}

          <div className="row" style={{ justifyContent: "space-between" }}>
            <button className="btn btnPrimary" type="submit" disabled={loading}>
              {loading ? "Procesando..." : mode === "login" ? "Entrar" : "Crear cuenta"}
            </button>

            <button
              type="button"
              className="btn"
              onClick={() => setMode(mode === "login" ? "signup" : "login")}
              disabled={loading}
            >
              {mode === "login" ? "Crear cuenta" : "Volver a login"}
            </button>
          </div>
        </form>
      </section>

      <section className="card">
        <div className="h1">Checklist rápido</div>
        <ul>
          <li>Env vars en Vercel: <code>NEXT_PUBLIC_SUPABASE_URL</code> y <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code></li>
          <li>Supabase Auth habilitado (Email/Password)</li>
          <li>Si usás confirmación por email, configurá Redirect URLs en Supabase</li>
        </ul>
      </section>
    </main>
  );
}
