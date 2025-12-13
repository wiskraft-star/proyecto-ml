import "./globals.css";
import type { Metadata } from "next";
import { Shell } from "@/components/shell";
import { ThemeProvider } from "@/components/theme-provider";

export const metadata: Metadata = {
  title: "PROYECTO ML — Panel PRO",
  description: "Integrador y panel de control para Mercado Libre",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <Shell>{children}</Shell>
        </ThemeProvider>
      </body>
    </html>
  );
}
