import type { Master, SalonSettings } from "@/types";

/**
 * ЗНАЧЕНИЯ ПО УМОЛЧАНИЮ.
 *
 * Это уже не «настройки салона», а стартовый набор: при первом запуске
 * они копируются в хранилище, дальше управляющая правит их через /admin,
 * и код сюда больше не заглядывает.
 */
export const defaultSettings: SalonSettings = {
  workingHours: [
    { weekday: 1, open: "09:00", close: "20:00" },
    { weekday: 2, open: "09:00", close: "20:00" },
    { weekday: 3, open: "09:00", close: "20:00" },
    { weekday: 4, open: "09:00", close: "20:00" },
    { weekday: 5, open: "09:00", close: "20:00" },
    { weekday: 6, open: "10:00", close: "18:00" },
    { weekday: 0, open: "10:00", close: "18:00" },
  ],
  closedDates: [],
  slotStepMin: 30,
  horizonDays: 60,
};

export const defaultMasters: Master[] = [
  {
    id: "anna",
    name: "Анна",
    role: "Колорист, стрижки",
    active: true,
    serviceIds: ["haircut", "coloring", "styling"],
    weekdaysOff: [0],
  },
  {
    id: "lena",
    name: "Лена",
    role: "Мастер ногтевого сервиса",
    active: true,
    serviceIds: ["manicure"],
    weekdaysOff: [1],
  },
  {
    id: "vera",
    name: "Вера",
    role: "Брови и ресницы",
    active: true,
    serviceIds: [],
    weekdaysOff: [2],
  },
];

/** Русские названия дней для админки и подписей */
export const weekdayNames: Record<number, string> = {
  1: "Понедельник",
  2: "Вторник",
  3: "Среда",
  4: "Четверг",
  5: "Пятница",
  6: "Суббота",
  0: "Воскресенье",
};

/** Порядок вывода: неделя начинается с понедельника */
export const weekdayOrder = [1, 2, 3, 4, 5, 6, 0];

/**
 * MOCK: демонстрационная занятость, чтобы сетка слотов не выглядела пустой.
 * Ключ — смещение в днях от сегодня. Реальные брони приходят из репозитория
 * и складываются с этими интервалами.
 */
const MOCK_BUSY: Record<string, Array<[string, number]>> = {
  "+0": [["11:00", 120], ["15:00", 180]],
  "+1": [["09:00", 90], ["13:00", 60], ["16:30", 90]],
  "+2": [["10:00", 180]],
  "+3": [["12:00", 120], ["17:00", 60]],
};

export function getMockBusy(dateISO: string): Array<[string, number]> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(`${dateISO}T00:00:00`);
  const diff = Math.round((target.getTime() - today.getTime()) / 86400000);
  return MOCK_BUSY[`+${diff}`] ?? [];
}
