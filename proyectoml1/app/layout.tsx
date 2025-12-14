import "./globals.css";
import type { Metadata } from "next";
import { Shell } from "@/components/shell";

export const metadata: Metadata = {
  title: "PROYECTO ML — Panel PRO",
  description: "Integrador y panel de control para Mercado Libre",
};

const themeInit = `(() => {
  try {
    const saved = localStorage.getItem("pm_theme");
    const theme = saved === "dark" ? "dark" : "light";
    if (theme === "dark") document.documentElement.classList.add("dark");
  } catch {}
})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body>
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
