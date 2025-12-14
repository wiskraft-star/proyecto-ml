import { cn } from "./cn";

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        "w-full rounded-xl border border-border bg-panel px-3 py-2 text-sm text-text outline-none placeholder:text-muted/70 focus:border-accent/60",
        props.className
      )}
    />
  );
}
