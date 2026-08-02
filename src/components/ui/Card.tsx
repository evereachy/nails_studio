import { cn } from "@/lib/cn";

export function Card({
  className,
  children,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...rest}
      className={cn(
        "rounded-card border border-line bg-elevated shadow-soft",
        "transition-shadow duration-300 ease-soft",
        className,
      )}
    >
      {children}
    </div>
  );
}
