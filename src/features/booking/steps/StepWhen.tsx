"use client";

import { useMemo } from "react";
import { BOOKING_HORIZON_DAYS } from "@/config/schedule";
import { getService } from "@/config/catalog";
import { cn } from "@/lib/cn";
import { formatDuration, splitDate } from "@/lib/format";
import { buildDays, buildSlots } from "@/lib/slots";
import { useBooking } from "../BookingProvider";

export function StepWhen() {
  const { draft, patch, fieldErrors } = useBooking();
  const service = getService(draft.serviceId);

  const days = useMemo(() => buildDays(BOOKING_HORIZON_DAYS).filter((d) => !d.closed), []);
  const slots = useMemo(
    () => (draft.date && service ? buildSlots(draft.date, service.durationMin) : []),
    [draft.date, service],
  );

  if (!service) {
    return <p className="text-muted">Сначала выберите услугу.</p>;
  }

  const free = slots.filter((s) => s.available);

  return (
    <div className="space-y-7">
      <div>
        <p className="mb-3 text-sm text-muted">Дата</p>
        {/* горизонтальная лента вместо нативного календаря:
            на мобиле выбор в один тап, без модалок ОС */}
        <div className="rail">
          {days.map(({ iso }) => {
            const { day, weekday } = splitDate(iso);
            const active = draft.date === iso;
            return (
              <button
                key={iso}
                onClick={() => patch({ date: iso, time: null })}
                className={cn(
                  "flex h-[68px] w-[58px] flex-col items-center justify-center rounded-control border",
                  "transition-colors duration-200 ease-soft",
                  active ? "border-ink bg-accent text-accent-ink" : "border-line bg-elevated",
                )}
              >
                <span className="text-xs uppercase opacity-70">{weekday}</span>
                <span className="mt-1 text-lg tabular-nums">{day}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <p className="text-sm text-muted">Время</p>
          <p className="text-xs text-muted">Процедура — {formatDuration(service.durationMin)}</p>
        </div>

        {!draft.date ? (
          <p className="rounded-control bg-surface px-4 py-5 text-sm text-muted">
            Выберите дату — покажем свободные часы.
          </p>
        ) : free.length === 0 ? (
          <p className="rounded-control bg-surface px-4 py-5 text-sm text-muted">
            На этот день всё занято. Посмотрите соседние даты или позвоните нам — иногда
            освобождаются окна.
          </p>
        ) : (
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
            {slots.map((s) => {
              const active = draft.time === s.time;
              return (
                <button
                  key={s.time}
                  disabled={!s.available}
                  onClick={() => patch({ time: s.time })}
                  className={cn(
                    "min-h-11 rounded-control border text-[15px] tabular-nums",
                    "transition-colors duration-200 ease-soft",
                    active
                      ? "border-ink bg-accent text-accent-ink"
                      : "border-line bg-elevated hover:border-ink/30",
                    !s.available && "cursor-not-allowed border-transparent bg-surface text-muted/40 line-through",
                  )}
                >
                  {s.time}
                </button>
              );
            })}
          </div>
        )}

        {fieldErrors.time && <p className="mt-3 text-sm text-red-500">{fieldErrors.time}</p>}
      </div>
    </div>
  );
}
