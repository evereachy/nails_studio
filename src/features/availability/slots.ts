import type { ScheduleContext, SlotState } from "@/types";

export function toMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export function toTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function overlaps(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
  return aStart < bEnd && bStart < aEnd;
}

export function toISO(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Calculates available time slots for a given date and service duration.
 * Pure function relying exclusively on dynamically supplied schedule context.
 */
export function buildSlots(
  ctx: ScheduleContext,
  dateISO: string,
  durationMin: number,
): SlotState[] {
  const { settings, busy } = ctx;

  if (settings.closedDates.includes(dateISO)) return [];

  const [year, month, dayNum] = dateISO.split("-").map(Number);
  const date = new Date(year, (month || 1) - 1, dayNum || 1);

  if (isNaN(date.getTime())) return [];

  const day = settings.workingHours.find((w) => w.weekday === date.getDay());
  if (!day?.open || !day.close) return [];

  const openMin = toMinutes(day.open);
  const closeMin = toMinutes(day.close);
  const intervals = (busy[dateISO] ?? []).map(
    ([start, dur]) => [toMinutes(start), toMinutes(start) + dur] as const,
  );

  const now = new Date();
  const isToday =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();
  const nowMin = now.getHours() * 60 + now.getMinutes();

  const step = settings.slotStepMin || 30;
  const slots: SlotState[] = [];

  for (let start = openMin; start + durationMin <= closeMin; start += step) {
    const end = start + durationMin;
    let state: SlotState = { time: toTime(start), available: true };

    if (isToday && start <= nowMin + 30) {
      state = { ...state, available: false, reason: "past" };
    } else if (intervals.some(([bs, be]) => overlaps(start, end, bs, be))) {
      state = { ...state, available: false, reason: "booked" };
    }
    slots.push(state);
  }

  return slots;
}

/** Builds booking horizon calendar days with closure statuses */
export function buildDays(ctx: ScheduleContext): Array<{ iso: string; closed: boolean }> {
  const { settings } = ctx;
  const out: Array<{ iso: string; closed: boolean }> = [];
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  for (let i = 0; i < settings.horizonDays; i++) {
    const d = new Date(cursor);
    d.setDate(cursor.getDate() + i);
    const iso = toISO(d);
    const day = settings.workingHours.find((w) => w.weekday === d.getDay());
    out.push({ iso, closed: !day?.open || settings.closedDates.includes(iso) });
  }

  return out;
}

/** Calculates longest working day duration across week schedule */
export function longestWorkday(ctx: ScheduleContext): number {
  const spans = ctx.settings.workingHours
    .filter((d) => d.open && d.close)
    .map((d) => toMinutes(d.close!) - toMinutes(d.open!));
  return spans.length ? Math.max(...spans) : 0;
}
