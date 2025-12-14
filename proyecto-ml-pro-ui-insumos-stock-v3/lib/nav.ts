import type { LucideIcon } from "lucide-react";
import { LayoutDashboard, TrendingUp, Wallet, Package, RotateCcw, Tag, BarChart3, PlugZap, Settings } from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  section: "Inicio" | "Operación" | "Finanzas" | "Inventario" | "Sistema";
};

export const NAV: NavItem[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, section: "Inicio" },
  { href: "/ventas", label: "Ventas", icon: TrendingUp, section: "Operación" },
  { href: "/rentabilidad", label: "Rentabilidad", icon: Wallet, section: "Finanzas" },
  { href: "/gastos", label: "Gastos", icon: Wallet, section: "Finanzas" },
  { href: "/stock", label: "Stock", icon: Package, section: "Inventario" },
  { href: "/insumos", label: "Insumos", icon: Package, section: "Inventario" },
  { href: "/postventa", label: "Postventa", icon: RotateCcw, section: "Operación" },
  { href: "/publicaciones", label: "Publicaciones", icon: Tag, section: "Operación" },
  { href: "/reportes", label: "Reportes", icon: BarChart3, section: "Finanzas" },
  { href: "/integraciones", label: "Integraciones", icon: PlugZap, section: "Sistema" },
  { href: "/parametros", label: "Parámetros", icon: Settings, section: "Sistema" },
];

export const NAV_SECTIONS: Array<NavItem["section"]> = ["Inicio", "Operación", "Finanzas", "Inventario", "Sistema"];
