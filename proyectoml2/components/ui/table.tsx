import * as React from "react";

import { cn } from "./cn";

export function Table({ children }: { children?: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border">
      <table className="w-full border-collapse text-sm">{children}</table>
    </div>
  );
}

export function THead({ children }: { children?: React.ReactNode }) {
  return (
    <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
      {children}
    </thead>
  );
}

export function TR({ children, className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={cn("border-b border-border/60 last:border-b-0", className)}
      {...props}
    >
      {children}
    </tr>
  );
}

export function TH({ children, className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn("px-3 py-2 text-left font-medium", className)}
      {...props}
    >
      {children}
    </th>
  );
}

export function TD({ children, className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td className={cn("px-3 py-2 align-middle", className)} {...props}>
      {children}
    </td>
  );
}
