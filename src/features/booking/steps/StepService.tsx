"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import { formatDuration, formatPrice } from "@/lib/utils/format";
import { MAX_ITEMS, exceedsWorkday, isSelected, summarize } from "@/features/booking/selection";
import { useBookingStore } from "../store/useBookingStore";
import { useAvailabilityStore } from "../store/useAvailabilityStore";
import { services } from "@/mock/catalog";
import { minPrice } from "@/lib/catalog";

/**
 * Step 1: Procedure selection.
 *
 * Each service expands into duration variants — this allows the user to specify
 * whether they need 1 or 3 hours, keeping the schedule accurate.
 * Multiple services can be selected in a single booking session.
 */
export function StepService() {
  const draft = useBookingStore((s) => s.draft);
  const toggle = useBookingStore((s) => s.toggle);
  const fieldErrors = useBookingStore((s) => s.fieldErrors);

  const data = useAvailabilityStore((s) => s.data);
  const [openId, setOpenId] = useState<string | null>(null);

  const summary = summarize(draft.items);
  const full = draft.items.length >= MAX_ITEMS;
  const tooLong = exceedsWorkday(data, summary.durationMin);

  return (
    <div className="space-y-2">
      {services.map((service) => {
        const picked = draft.items.find((i) => i.serviceId === service.id);
        const pickedVariant = picked
          ? service.variants.find((v) => v.id === picked.variantId)
          : null;
        const expanded = openId === service.id;
        const locked = full && !picked;

        return (
          <div
            key={service.id}
            className={cn(
              "overflow-hidden rounded-control border transition-colors duration-200 ease-soft",
              picked ? "border-ink bg-surface" : "border-line bg-elevated",
              locked && "opacity-45",
            )}
          >
            <button
              onClick={() => setOpenId(expanded ? null : service.id)}
              disabled={locked}
              aria-expanded={expanded}
              className="flex w-full items-center gap-3.5 px-4 py-[18px] text-left"
            >
              {/* Checkmark icon indicating multi-selection */}
              <span
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-[9px] border",
                  picked ? "border-ink bg-accent text-accent-ink" : "border-line",
                )}
                aria-hidden
              >
                {picked && (
                  <svg viewBox="0 0 20 20" className="h-3.5 w-3.5">
                    <path
                      d="M4 10.5l4 4 8-9"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </span>

              <span className="min-w-0 flex-1">
                <span className="block truncate text-[15px]">{service.title}</span>
                <span className="mt-0.5 block truncate text-sm text-muted">
                  {pickedVariant
                    ? `${pickedVariant.label} · ${formatDuration(pickedVariant.durationMin)}`
                    : `${service.variants.length} options · from ${formatPrice(minPrice(service), service.currency)}`}
                </span>
              </span>

              <span
                className="shrink-0 text-muted transition-transform duration-300 ease-soft"
                style={{ transform: expanded ? "rotate(180deg)" : "none" }}
                aria-hidden
              >
                <svg viewBox="0 0 20 20" className="h-4 w-4">
                  <path
                    d="M5 8l5 5 5-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </button>

            <AnimatePresence initial={false}>
              {expanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden"
                >
                  <div className="space-y-2 px-2.5 pb-2.5">
                    {service.variants.map((variant) => {
                      const active = isSelected(draft.items, service.id, variant.id);
                      return (
                        <button
                          key={variant.id}
                          onClick={() => toggle({ serviceId: service.id, variantId: variant.id })}
                          className={cn(
                            "flex min-h-14 w-full items-center justify-between gap-3 rounded-control border px-4 py-3 text-left",
                            "transition-colors duration-200 ease-soft",
                            active
                              ? "border-ink bg-accent text-accent-ink"
                              : "border-line bg-bg active:bg-surface",
                          )}
                        >
                          <span className="min-w-0">
                            <span className="block truncate text-sm">{variant.label}</span>
                            <span
                              className={cn(
                                "text-xs",
                                active ? "opacity-75" : "text-muted",
                              )}
                            >
                              {formatDuration(variant.durationMin)}
                            </span>
                          </span>
                          <span className="shrink-0 text-sm tabular-nums">
                            {formatPrice(variant.price, service.currency)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}

      {full && (
        <p className="pt-1 text-sm text-muted">
          Maximum of {MAX_ITEMS} procedures per visit to prevent overly long appointments.
        </p>
      )}

      {tooLong && (
        <p className="rounded-control bg-surface px-4 py-3 text-sm text-muted">
          Total time is {formatDuration(summary.durationMin)}. This exceeds a single workday limit — please remove an item or split across two days.
        </p>
      )}

      {fieldErrors.items && <p className="pt-1 text-sm text-red-500">{fieldErrors.items}</p>}
    </div>
  );
}
