import { cn } from "@/lib/utils/cn";

interface ContainerProps {
  className?: string;
  children: React.ReactNode;
}

export function Container({ className, children }: ContainerProps) {
  return (
    <div className={cn("mx-auto w-full max-w-container px-[var(--pad-x)]", className)}>
      {children}
    </div>
  );
}
