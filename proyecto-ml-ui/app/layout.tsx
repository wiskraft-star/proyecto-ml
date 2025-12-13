import type { Metadata } from "next";
import "@/styles/globals.css";
import { AppShell } from "@/components/layout/shell";

export const metadata: Metadata = {
  title: "PROYECTO ML",
  description: "Panel personal (UI primero, datos después)"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
