"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Receipt, ShoppingCart, Package, SlidersHorizontal } from "lucide-react";

const items = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/ventas", label: "Ventas", icon: ShoppingCart },
  { href: "/gastos", label: "Gastos", icon: Receipt },
  { href: "/stock", label: "Stock", icon: Package },
  { href: "/parametros", label: "Parámetros", icon: SlidersHorizontal }
];

export function SideNav() {
  const pathname = usePathname();

  return (
    <nav className="space-y-1">
      {items.map((item) => {
        const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "group flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition",
              active ? "bg-zinc-900 text-white" : "text-zinc-700 hover:bg-zinc-100"
            )}
          >
            <Icon className={cn("h-4 w-4", active ? "text-white" : "text-zinc-500 group-hover:text-zinc-700")} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
