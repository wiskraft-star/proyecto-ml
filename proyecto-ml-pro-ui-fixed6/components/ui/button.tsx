import * as React from "react";
import { cn } from "./cn";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md";
};

export function Button({ className, variant="secondary", size="md", ...props }: Props) {
  const base = "inline-flex items-center justify-center rounded-xl border px-3 py-2 text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed";
  const sizes = size === "sm" ? "px-2.5 py-1.5 text-xs" : "";
  const variants: Record<string,string> = {
    primary: "border-transparent bg-accent text-white hover:opacity-90",
    secondary: "border-border bg-panel hover:bg-panel2",
    ghost: "border-transparent bg-transparent hover:bg-panel2/60",
    danger: "border-transparent bg-bad text-white hover:opacity-90",
  };
  return <button className={cn(base, sizes, variants[variant], className)} {...props} />;
}
