import { cn } from "./cn";

export function Badge({ tone="neutral", children, className }: { tone?: "neutral"|"good"|"warn"|"bad"; children: React.ReactNode; className?: string; }) {
  const tones = {
    neutral: "border-border bg-panel2 text-muted",
    good: "border-good/30 bg-good/10 text-good",
    warn: "border-warn/30 bg-warn/10 text-warn",
    bad: "border-bad/30 bg-bad/10 text-bad",
  } as const;
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs font-medium", tones[tone], className)}>
      {children}
    </span>
  );
}
