import "./globals.css";
import type { Metadata } from "next";
import { Nav } from "@/components/Nav";
import { getUserOrNull } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Margen Neto",
  description: "App para calcular margen neto real (ML + MP + costos).",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getUserOrNull();

  return (
    <html lang="es">
      <body>
        <div className="container">
          <Nav userEmail={user?.email} />
          {children}
        </div>
      </body>
    </html>
  );
}
