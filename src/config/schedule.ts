import type { WorkingDay } from "@/types";

/** График салона. Позже приедет из админки. */
export const workingHours: WorkingDay[] = [
  { weekday: 1, open: "09:00", close: "20:00" },
  { weekday: 2, open: "09:00", close: "20:00" },
  { weekday: 3, open: "09:00", close: "20:00" },
  { weekday: 4, open: "09:00", close: "20:00" },
  { weekday: 5, open: "09:00", close: "20:00" },
  { weekday: 6, open: "10:00", close: "18:00" },
  { weekday: 0, open: null, close: null }, // воскресенье
];

/** Шаг сетки слотов в минутах */
export const SLOT_STEP_MIN = 30;

/** На сколько дней вперёд открыта запись */
export const BOOKING_HORIZON_DAYS = 21;

/**
 * MOCK: уже занятые интервалы.
 * Ключ — дата YYYY-MM-DD, значение — [начало, длительность в минутах].
 * Заменяется на SELECT из БД, сигнатура getBusyIntervals() не меняется.
 */
const MOCK_BUSY: Record<string, Array<[string, number]>> = {
  "+0": [["11:00", 120], ["15:00", 180]],
  "+1": [["09:00", 90], ["13:00", 60], ["16:30", 90]],
  "+2": [["10:00", 180]],
  "+3": [["12:00", 120], ["17:00", 60]],
};

/** Демо-генерация: раскладываем моки относительно сегодняшнего дня. */
export function getBusyIntervals(dateISO: string): Array<[string, number]> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(`${dateISO}T00:00:00`);
  const diff = Math.round((target.getTime() - today.getTime()) / 86400000);
  return MOCK_BUSY[`+${diff}`] ?? [];
}
