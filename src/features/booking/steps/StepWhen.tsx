"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import { formatDuration, splitDate } from "@/lib/format";
import { buildDays, buildSlots } from "@/lib/slots";
import { exceedsWorkday, mastersForItems, summarize } from "@/lib/selection";
import { useBooking } from "../BookingProvider";
import { useAvailability } from "../AvailabilityProvider";

export function StepWhen() {
  const { draft, patch, fieldErrors } = useBooking();
  const { data, loading, error, load } = useAvailability();

  // Итог по всем выбранным процедурам: длительность визита — это их сумма.
  const summary = useMemo(() => summarize(draft.items), [draft.items]);

  // Мастера, которые делают ВСЕ выбранные процедуры.
  // Показывать остальных бессмысленно: человек выберет и упрётся в отказ.
  const eligible = useMemo(
    () => (data ? mastersForItems(data.masters, draft.items) : []),
    [data, draft.items],
  );

  // Дни, доступные для записи у выбранного мастера
  const bookableDays = useMemo(
    () => (data ? buildDays(data).filter((d) => !d.closed) : []),
    [data],
  );

  const bookableSet = useMemo(
    () => new Set(bookableDays.map((d) => d.iso)),
    [bookableDays],
  );

  // Unique months that contain at least one bookable day
  const months = useMemo(() => {
    const map = new Map<string, true>();
    bookableDays.forEach((d) => map.set(d.iso.slice(0, 7), true));
    return Array.from(map.keys()).sort();
  }, [bookableDays]);

  const [monthIndex, setMonthIndex] = useState(0);
  const currentYm = months[monthIndex] ?? months[0]; // "YYYY-MM"

  // Слоты считаются от СУММАРНОЙ длительности:
  // стрижка 90 мин + маникюр 120 мин = мастеру нужно свободное окно в 3.5 часа.
  const slots = useMemo(
    () =>
      data && draft.date && summary.durationMin
        ? buildSlots(data, draft.date, summary.durationMin)
        : [],
    [data, draft.date, summary.durationMin],
  );

  /** Смена мастера перезагружает расписание и сбрасывает время */
  const pickMaster = (masterId: string | null) => {
    patch({ masterId, time: null });
    load(masterId);
  };

  if (summary.items.length === 0) {
    return <p className="text-muted">Сначала выберите хотя бы одну процедуру.</p>;
  }

  if (!data) {
    return (
      <p className="rounded-control bg-surface px-4 py-5 text-sm text-muted">
        {error ? `${error}. Обновите страницу или позвоните нам.` : "Загружаем расписание…"}
      </p>
    );
  }

  // Набор из нескольких процедур может не влезть в смену.
  // Без этой проверки человек увидел бы пустую сетку и решил, что всё занято.
  if (exceedsWorkday(data, summary.durationMin)) {
    return (
      <p className="rounded-control bg-surface px-4 py-5 text-sm text-muted">
        Выбрано на {formatDuration(summary.durationMin)} — это дольше рабочего дня.
        Вернитесь на шаг назад и уберите одну процедуру.
      </p>
    );
  }

  const free = slots.filter((s) => s.available);

  return (
    <div className="space-y-8">
      {/* ===== MASTER ===== */}
      {eligible.length > 0 && (
        <div>
          <p className="mb-3 text-sm text-muted">Мастер</p>

          <div className="rail">
            <button
              type="button"
              onClick={() => pickMaster(null)}
              className={cn(
                "min-h-11 rounded-control border px-4 text-[15px] transition-colors duration-200 ease-soft",
                draft.masterId === null
                  ? "border-ink bg-accent text-accent-ink"
                  : "border-line bg-elevated",
              )}
            >
              Любой
            </button>

            {eligible.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => pickMaster(m.id)}
                className={cn(
                  "min-h-11 rounded-control border px-4 text-left text-[15px]",
                  "transition-colors duration-200 ease-soft",
                  draft.masterId === m.id
                    ? "border-ink bg-accent text-accent-ink"
                    : "border-line bg-elevated",
                )}
              >
                {m.name}
              </button>
            ))}
          </div>

          <p className="mt-2 text-xs text-muted">
            {draft.masterId
              ? "Показываем только его свободные часы"
              : "Свободное время любого подходящего мастера"}
          </p>
        </div>
      )}

      {/* ===== DATE ===== */}
      <div>
        <p className="mb-3 text-sm text-muted">Дата</p>

        <div
          className={cn(
            "rounded-2xl border border-line bg-elevated overflow-hidden",
            // при смене мастера сетка перестраивается — гасим её, чтобы
            // не тапнули по дате, которая через миг станет недоступной
            loading && "pointer-events-none opacity-50",
          )}
        >
          {/* Month header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-line bg-surface/60">
            <button
              type="button"
              onClick={() => setMonthIndex((i) => Math.max(0, i - 1))}
              disabled={monthIndex === 0}
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full text-lg transition-colors",
                monthIndex === 0
                  ? "text-muted/40 cursor-not-allowed"
                  : "hover:bg-line/60 active:bg-line",
              )}
              aria-label="Предыдущий месяц"
            >
              ‹
            </button>

            <p className="text-[15px] font-medium capitalize">
              {formatMonthLabel(currentYm)}
            </p>

            <button
              type="button"
              onClick={() =>
                setMonthIndex((i) => Math.min(months.length - 1, i + 1))
              }
              disabled={monthIndex >= months.length - 1}
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full text-lg transition-colors",
                monthIndex >= months.length - 1
                  ? "text-muted/40 cursor-not-allowed"
                  : "hover:bg-line/60 active:bg-line",
              )}
              aria-label="Следующий месяц"
            >
              ›
            </button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-px px-2 pt-3 pb-1">
            {["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"].map((d) => (
              <div
                key={d}
                className="text-center text-[11px] font-medium uppercase tracking-wide text-muted"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Full month grid */}
          <div className="grid grid-cols-7 gap-1.5 p-2 sm:p-3">
            {buildFullMonthCells(currentYm, bookableSet).map((cell, idx) => {
              if (cell.type === "empty") {
                return <div key={`e-${idx}`} className="aspect-square" />;
              }

              const { iso, day, disabled } = cell;
              const isSelected = draft.date === iso;
              const isToday = iso === todayIso();

              return (
                <button
                  key={iso}
                  type="button"
                  disabled={disabled}
                  onClick={() => !disabled && patch({ date: iso, time: null })}
                  className={cn(
                    "relative flex aspect-square items-center justify-center rounded-xl text-[15px] font-medium tabular-nums",
                    "transition-all duration-150",
                    disabled
                      ? "text-muted/35 cursor-not-allowed"
                      : "active:scale-95",
                    isSelected
                      ? "bg-accent text-accent-ink shadow-md shadow-accent/25"
                      : !disabled && "bg-surface hover:bg-line/50 text-ink",
                    isToday && !isSelected && !disabled && "ring-2 ring-accent/40",
                  )}
                >
                  {day}
                  {isToday && !isSelected && (
                    <span className="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-accent" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {draft.date && (
          <p className="mt-3 text-center text-sm text-muted">
            Выбрано:{" "}
            <span className="font-medium text-ink">
              {formatSelectedDate(draft.date)}
            </span>
          </p>
        )}
      </div>

      {/* ===== TIME ===== */}
      <div>
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <p className="text-sm text-muted">Время начала</p>
          <p className="text-xs text-muted">
            Визит займёт {formatDuration(summary.durationMin)}
          </p>
        </div>

        {!draft.date ? (
          <p className="rounded-control bg-surface px-4 py-5 text-sm text-muted">
            Выберите дату — покажем свободные часы.
          </p>
        ) : free.length === 0 ? (
          <p className="rounded-control bg-surface px-4 py-5 text-sm text-muted">
            На этот день нет свободного окна в {formatDuration(summary.durationMin)}{" "}
            подряд. Посмотрите соседние даты или уберите одну процедуру.
          </p>
        ) : (
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
            {slots.map((s) => {
              const active = draft.time === s.time;
              return (
                <button
                  key={s.time}
                  type="button"
                  disabled={!s.available}
                  onClick={() => patch({ time: s.time })}
                  className={cn(
                    "min-h-11 rounded-control border text-[15px] tabular-nums",
                    "transition-colors duration-200 ease-soft",
                    active
                      ? "border-ink bg-accent text-accent-ink"
                      : "border-line bg-elevated hover:border-ink/30",
                    !s.available &&
                    "cursor-not-allowed border-transparent bg-surface text-muted/40 line-through",
                  )}
                >
                  {s.time}
                </button>
              );
            })}
          </div>
        )}

        {fieldErrors.time && (
          <p className="mt-3 text-sm text-red-500">{fieldErrors.time}</p>
        )}
      </div>
    </div>
  );
}

/* ---------- helpers ---------- */

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function formatMonthLabel(ym: string) {
  const [y, m] = ym.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("ru-RU", {
    month: "long",
    year: "numeric",
  });
}

function formatSelectedDate(iso: string) {
  return new Date(iso + "T12:00:00").toLocaleDateString("ru-RU", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

/** Classic full-month grid (Monday-first) */
function buildFullMonthCells(
  ym: string,
  bookableSet: Set<string>,
) {
  const [year, month] = ym.split("-").map(Number); // month is 1-based
  const firstOfMonth = new Date(year, month - 1, 1);
  const daysInMonth = new Date(year, month, 0).getDate();

  // Monday = 0 … Sunday = 6
  const firstWeekday = (firstOfMonth.getDay() + 6) % 7;

  const cells: Array<
    | { type: "empty" }
    | { type: "day"; iso: string; day: number; disabled: boolean }
  > = [];

  // Leading empty cells
  for (let i = 0; i < firstWeekday; i++) {
    cells.push({ type: "empty" });
  }

  // Every day of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const iso = `${ym}-${String(day).padStart(2, "0")}`;
    const disabled = !bookableSet.has(iso); // past + closed + beyond horizon

    cells.push({ type: "day", iso, day, disabled });
  }

  return cells;
}
