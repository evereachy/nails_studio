"use client";

import { services } from "@/config/catalog";
import { cn } from "@/lib/cn";
import { formatDuration, formatPrice } from "@/lib/format";
import { useBooking } from "../BookingProvider";

export function StepService() {
  const { draft, patch, goTo } = useBooking();

  return (
    <div className="space-y-2">
      {services.map((s) => {
        const active = draft.serviceId === s.id;
        return (
          <button
            key={s.id}
            onClick={() => {
              patch({ serviceId: s.id, time: null });
              goTo(2);
            }}
            className={cn(
              "flex w-full items-center justify-between gap-4 rounded-control border px-4 py-4 text-left",
              "transition-colors duration-200 ease-soft",
              active ? "border-ink bg-surface" : "border-line bg-elevated hover:border-ink/30",
            )}
          >
            <span className="min-w-0">
              <span className="block truncate text-[15px]">{s.title}</span>
              <span className="mt-0.5 block text-sm text-muted">{formatDuration(s.durationMin)}</span>
            </span>
            <span className="shrink-0 text-[15px] tabular-nums">{formatPrice(s.price, s.currency)}</span>
          </button>
        );
      })}
    </div>
  );
}
