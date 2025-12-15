import "./globals.css";
import type { Metadata } from "next";
import { SidebarNav } from "@/components/SidebarNav";

export const metadata: Metadata = {
  title: "ML Margen Neto (MVP)",
  description: "Calculadora real de margen neto Mercado Libre + Mercado Pago",
};

export default function RootLayout({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <html lang="es">
      <body>
        <div className="min-h-screen flex flex-col md:flex-row">
          <SidebarNav />
          <main className="flex-1 p-4 md:p-6">{children}</main>
        </div>
      </body>
    </html>
  );
}
