"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { useState } from "react";

export function Nav({ userEmail }: { userEmail?: string | null }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);

  async function signOut() {
    setLoading(true);
    try {
      const supabase = createSupabaseBrowserClient();
      await supabase.auth.signOut();
      router.push("/login");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  const loggedIn = Boolean(userEmail);

  return (
    <div className="nav">
      <div className="row">
        <Link href="/" className="row" style={{ gap: 10 }}>
          <strong>Margen Neto</strong>
          <span className="badge">MVP</span>
        </Link>
        {loggedIn && userEmail ? <span className="badge">{userEmail}</span> : null}
      </div>

      <div className="navlinks">
        {loggedIn ? (
          <>
            <Link href="/" style={{ fontWeight: pathname === "/" ? 800 : 600 }}>
              Inicio
            </Link>
            <Link href="/ventas" style={{ fontWeight: pathname?.startsWith("/ventas") ? 800 : 600 }}>
              Ventas
            </Link>
            <Link href="/cobros" style={{ fontWeight: pathname?.startsWith("/cobros") ? 800 : 600 }}>
              Cobros
            </Link>
            <Link href="/costos" style={{ fontWeight: pathname?.startsWith("/costos") ? 800 : 600 }}>
              Costos SKU
            </Link>
            <Link href="/insumos" style={{ fontWeight: pathname?.startsWith("/insumos") ? 800 : 600 }}>
              Insumos
            </Link>
            <Link href="/metricas" style={{ fontWeight: pathname?.startsWith("/metricas") ? 800 : 600 }}>
              Métricas
            </Link>
            <button className="btn btnDanger" onClick={signOut} disabled={loading}>
              {loading ? "Saliendo..." : "Cerrar sesión"}
            </button>
          </>
        ) : (
          <Link href="/login" style={{ fontWeight: pathname?.startsWith("/login") ? 800 : 600 }}>
            Login
          </Link>
        )}
      </div>
    </div>
  );
}
