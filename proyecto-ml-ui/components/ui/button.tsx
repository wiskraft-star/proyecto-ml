import Link from "next/link";
import { cn } from "@/lib/utils";

type CommonProps = {
  variant?: "primary" | "secondary" | "ghost";
  className?: string;
  children: React.ReactNode;
};

const base =
  "inline-flex items-center justify-center rounded-xl px-3 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-zinc-300 disabled:opacity-50 disabled:pointer-events-none";

const variants: Record<NonNullable<CommonProps["variant"]>, string> = {
  primary: "bg-zinc-900 text-white hover:bg-zinc-800",
  secondary: "bg-zinc-100 text-zinc-900 hover:bg-zinc-200",
  ghost: "bg-transparent text-zinc-900 hover:bg-zinc-100"
};

export function Button(
  props:
    | (CommonProps & React.ButtonHTMLAttributes<HTMLButtonElement> & { href?: never })
    | (CommonProps & { href: string } & { target?: string })
) {
  const { variant = "primary", className, children } = props as CommonProps;

  if ("href" in props && props.href) {
    return (
      <Link href={props.href} target={(props as any).target} className={cn(base, variants[variant], className)}>
        {children}
      </Link>
    );
  }

  const { ...rest } = props as React.ButtonHTMLAttributes<HTMLButtonElement>;
  return (
    <button className={cn(base, variants[variant], className)} {...rest}>
      {children}
    </button>
  );
}
