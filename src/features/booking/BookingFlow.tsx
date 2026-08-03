"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { useBooking, type BookingStep } from "./BookingProvider";
import { StepService } from "./steps/StepService";
import { StepWhen } from "./steps/StepWhen";
import { StepContact } from "./steps/StepContact";
import { StepDone } from "./steps/StepDone";
import { formatDuration, formatPrice, isValidPhone } from "@/lib/format";
import { exceedsWorkday, summarize } from "@/lib/selection";
import { useAvailability } from "./AvailabilityProvider";

const titles: Record<BookingStep, string> = {
  1: "Что делаем",
  2: "Когда удобно",
  3: "Как с вами связаться",
  4: "Готово",
};

/**
 * Оркестратор шагов. Сам по себе не решает, где он показан —
 * поэтому одинаково работает и в шторке на мобиле, и в секции на десктопе.
 */
export function BookingFlow({ className }: { className?: string }) {
  const { step, goTo, draft, submit, status, error, reset } = useBooking();
  const { data } = useAvailability();

  const summary = summarize(draft.items);

  const canContinue =
    step === 1
      ? summary.items.length > 0 && !exceedsWorkday(data, summary.durationMin)
      : step === 2
        ? Boolean(draft.date && draft.time)
        : draft.name.trim().length >= 2 && isValidPhone(draft.phone);

  return (
    <div className={cn("flex min-h-0 flex-col", className)}>
      {step < 4 && (
        <div className="shrink-0 px-5 pb-4">
          <div className="mb-3 flex gap-1.5" aria-hidden>
            {[1, 2, 3].map((i) => (
              <span
                key={i}
                className={cn(
                  "h-[3px] flex-1 rounded-pill transition-colors duration-300",
                  i <= step ? "bg-accent" : "bg-line",
                )}
              />
            ))}
          </div>
          <p className="text-sm text-muted">
            Шаг {step} из 3 — <span className="text-ink">{titles[step as BookingStep]}</span>
          </p>
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto px-5">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
            {step === 1 && <StepService />}
            {step === 2 && <StepWhen />}
            {step === 3 && <StepContact />}
            {step === 4 && <StepDone />}
          </motion.div>
        </AnimatePresence>

        {error && step < 4 && (
          <p className="mt-4 rounded-control bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
        )}
      </div>

      {/* Панель действий закреплена внизу — на мобиле кнопка всегда под большим пальцем */}
      <div className="safe-b sticky bottom-0 shrink-0 border-t border-line bg-bg/90 px-5 pt-3 backdrop-blur">
        {/* Итог по корзине виден на всех шагах: человек всегда знает,
            сколько времени и денег стоит его набор процедур */}
        {step < 4 && summary.items.length > 0 && (
          <p className="mb-3 flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate text-muted">
              {summary.items.length}{" "}
              {summary.items.length === 1 ? "процедура" : summary.items.length < 5 ? "процедуры" : "процедур"}{" "}
              · {formatDuration(summary.durationMin)}
            </span>
            <span className="shrink-0 tabular-nums">
              {formatPrice(summary.price, summary.currency)}
            </span>
          </p>
        )}
        {step === 4 ? (
          <Button variant="secondary" fullWidth size="lg" onClick={reset}>
            Записаться ещё раз
          </Button>
        ) : (
          <div className="flex gap-2">
            {step > 1 && (
              <Button
                variant="secondary"
                size="lg"
                onClick={() => goTo((step - 1) as BookingStep)}
                aria-label="Назад"
                className="px-5"
              >
                <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden>
                  <path
                    d="M12 4l-6 6 6 6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </Button>
            )}
            <Button
              size="lg"
              fullWidth
              disabled={!canContinue}
              loading={status === "sending"}
              onClick={() => (step === 3 ? submit() : goTo((step + 1) as BookingStep))}
            >
              {step === 3 ? "Записаться" : "Дальше"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
