import type { ScheduleContext, SlotState } from "@/types";

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

export function toISO(d: Date) {
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 10);
}

/**
 * Главная логика записи.
 *
 * Функция стала чистой: график и занятость приходят аргументом, а не из
 * импорта конфига. Иначе админка была бы бессмысленной — клиент продолжал бы
 * считать слоты по значениям, вшитым в бандл на момент сборки.
 *
 * Слот доступен, если процедура целиком помещается в рабочий день
 * и не пересекается ни с одной занятой бронью.
 * Услуга 180 мин, старт 09:00 → занимает 09:00–12:00,
 * значит слоты 09:30…11:30 тоже гаснут.
 */
export function buildSlots(
  ctx: ScheduleContext,
  dateISO: string,
  durationMin: number,
): SlotState[] {
  const { settings, busy } = ctx;
  if (settings.closedDates.includes(dateISO)) return [];

  const date = new Date(`${dateISO}T00:00:00`);
  const day = settings.workingHours.find((d) => d.weekday === date.getDay());
  if (!day?.open || !day.close) return [];

  const openMin = toMinutes(day.open);
  const closeMin = toMinutes(day.close);
  const intervals = (busy[dateISO] ?? []).map(
    ([start, dur]) => [toMinutes(start), toMinutes(start) + dur] as const,
  );

  // сегодняшние прошедшие часы не показываем как свободные
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
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

/** Даты на горизонте записи + признак «в этот день записаться нельзя» */
export function buildDays(ctx: ScheduleContext) {
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

/** Самая длинная смена недели — предел для одного визита */
export function longestWorkday(ctx: ScheduleContext) {
  const spans = ctx.settings.workingHours
    .filter((d) => d.open && d.close)
    .map((d) => toMinutes(d.close!) - toMinutes(d.open!));
  return spans.length ? Math.max(...spans) : 0;
}
