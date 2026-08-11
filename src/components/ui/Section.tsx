import { cn } from "@/lib/utils/cn";
import { Container } from "./Container";

interface SectionProps {
  id?: string;
  eyebrow?: string;
  title?: string;
  lead?: string;
  className?: string;
  children: React.ReactNode;
}

/**
 * Unified section wrapper to manage padding, typography rhythm, and width across all blocks.
 */
export function Section({ id, eyebrow, title, lead, className, children }: SectionProps) {
  return (
    <section id={id} className={cn("py-[var(--gap-section)]", className)}>
      <Container>
        {(eyebrow || title || lead) && (
          <header className="mb-8 max-w-2xl md:mb-12">
            {eyebrow && (
              <p className="mb-3 text-xs uppercase tracking-[0.18em] text-muted">{eyebrow}</p>
            )}
            {title && (
              <h2 className="font-display text-[clamp(1.75rem,6vw,2.75rem)] leading-[1.1] tracking-tight">
                {title}
              </h2>
            )}
            {lead && <p className="mt-4 text-base leading-relaxed text-muted md:text-lg">{lead}</p>}
          </header>
        )}
        {children}
      </Container>
    </section>
  );
}
