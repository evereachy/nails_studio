interface StarsProps {
  value: number;
  max?: number;
  className?: string;
}

/**
 * Renders a star rating display (default max 5 stars).
 * Rounds fractional values to full stars for crisp visual rendering.
 */
export function Stars({ value, max = 5, className }: StarsProps) {
  const roundedValue = Math.round(value);

  return (
    <div
      className={`flex items-center gap-0.5 ${className ?? ""}`}
      aria-label={`Оценка ${value} из ${max}`}
      role="img"
    >
      {Array.from({ length: max }).map((_, i) => (
        <svg
          key={i}
          viewBox="0 0 20 20"
          className={i < roundedValue ? "h-3.5 w-3.5 fill-ink" : "h-3.5 w-3.5 fill-line"}
          aria-hidden="true"
        >
          <path d="M10 1.5l2.6 5.3 5.9.9-4.2 4.1 1 5.8L10 14.9l-5.3 2.7 1-5.8L1.5 7.7l5.9-.9z" />
        </svg>
      ))}
    </div>
  );
}
