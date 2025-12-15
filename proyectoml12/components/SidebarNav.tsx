import Link from "next/link";

type NavItem = { href: string; label: string };

const items: NavItem[] = [
  { href: "/metricas", label: "Métricas" },
  { href: "/ventas", label: "Ventas" },
  { href: "/cobros", label: "Cobros" },
  { href: "/stock-costos", label: "Stock/Costos" },
  { href: "/insumos", label: "Insumos" },
];

export function SidebarNav(): JSX.Element {
  return (
    <aside className="w-full md:w-56 border-b md:border-b-0 md:border-r border-zinc-200 bg-white">
      <div className="p-4">
        <div className="text-sm font-semibold">ML Margen Neto</div>
        <div className="text-xs text-zinc-500 mt-1">MVP</div>
      </div>
      <nav className="px-2 pb-4 flex md:block gap-2 overflow-x-auto">
        {items.map((it) => (
          <Link
            key={it.href}
            href={it.href}
            className="px-3 py-2 rounded-lg text-sm hover:bg-zinc-100 whitespace-nowrap"
          >
            {it.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
