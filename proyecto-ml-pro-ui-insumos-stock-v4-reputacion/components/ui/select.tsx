import { cn } from "./cn";

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={cn(
        "w-full rounded-xl border border-border bg-panel px-3 py-2 text-sm text-text outline-none focus:border-accent/60",
        props.className
      )}
    />
  );
}
