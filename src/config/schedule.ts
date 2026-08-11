import type { Master, SalonSettings } from "@/types";

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

export const weekdayNames: Record<number, string> = {
  1: "Понедельник",
  2: "Вторник",
  3: "Среда",
  4: "Четверг",
  5: "Пятница",
  6: "Суббота",
  0: "Воскресенье",
};

export const weekdayOrder = [1, 2, 3, 4, 5, 6, 0];
