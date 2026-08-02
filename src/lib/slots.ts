import { SLOT_STEP_MIN, getBusyIntervals, workingHours } from "@/config/schedule";
import type { SlotState } from "@/types";

export function toMinutes(time: string) {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export function toTime(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function overlaps(aStart: number, aEnd: number, bStart: number, bEnd: number) {
  return aStart < bEnd && bStart < aEnd;
}

/**
 * Главная логика записи.
 * Слот доступен, если процедура целиком помещается в рабочий день
 * и не пересекается ни с одной занятой бронью.
 *
 * Пример: услуга 180 мин, старт 09:00 → занимает 09:00–12:00,
 * значит слоты 09:30, 10:00, 10:30, 11:00, 11:30 тоже становятся недоступны.
 */
export function buildSlots(dateISO: string, durationMin: number): SlotState[] {
  const date = new Date(`${dateISO}T00:00:00`);
  const day = workingHours.find((d) => d.weekday === date.getDay());
  if (!day?.open || !day.close) return [];

  const openMin = toMinutes(day.open);
  const closeMin = toMinutes(day.close);
  const busy = getBusyIntervals(dateISO).map(
    ([start, dur]) => [toMinutes(start), toMinutes(start) + dur] as const,
  );

  // сегодняшние прошедшие часы не показываем как свободные
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const nowMin = now.getHours() * 60 + now.getMinutes();

  const slots: SlotState[] = [];
  for (let start = openMin; start + durationMin <= closeMin; start += SLOT_STEP_MIN) {
    const end = start + durationMin;
    let state: SlotState = { time: toTime(start), available: true };

    if (isToday && start <= nowMin + 30) {
      state = { ...state, available: false, reason: "past" };
    } else if (busy.some(([bs, be]) => overlaps(start, end, bs, be))) {
      state = { ...state, available: false, reason: "booked" };
    }
    slots.push(state);
  }
  return slots;
}

/** Даты на горизонте записи + признак «салон работает» */
export function buildDays(horizonDays: number) {
  const out: Array<{ iso: string; closed: boolean }> = [];
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  for (let i = 0; i < horizonDays; i++) {
    const d = new Date(cursor);
    d.setDate(cursor.getDate() + i);
    const tz = d.getTimezoneOffset() * 60000;
    const iso = new Date(d.getTime() - tz).toISOString().slice(0, 10);
    const day = workingHours.find((w) => w.weekday === d.getDay());
    out.push({ iso, closed: !day?.open });
  }
  return out;
}
