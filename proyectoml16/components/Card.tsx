import clsx from "clsx";

export function Card({
  title,
  children,
  className,
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
}): JSX.Element {
  return (
    <section className={clsx("bg-white border border-zinc-200 rounded-xl p-4", className)}>
      {title ? <div className="text-sm font-semibold mb-3">{title}</div> : null}
      {children}
    </section>
  );
}
