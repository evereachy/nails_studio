import type { Service } from "@/types";

/**
 * КАТАЛОГ УСЛУГ — mock-данные.
 * Позже заменяется на fetch из БД. Форма объекта остаётся той же.
 */
export const services: Service[] = [
  {
    id: "haircut",
    title: "Стрижка",
    category: "hair",
    durationMin: 90,
    price: 1200,
    currency: "Kč",
    description: "Консультация, мытьё, стрижка и укладка.",
    image:
      "https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=800&q=70",
  },
  {
    id: "coloring",
    title: "Окрашивание",
    category: "hair",
    durationMin: 180,
    price: 3400,
    currency: "Kč",
    description: "Подбор тона, окрашивание, уход и укладка.",
    image:
      "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=70",
  },
  {
    id: "styling",
    title: "Укладка",
    category: "hair",
    durationMin: 60,
    price: 900,
    currency: "Kč",
    description: "Вечерняя или повседневная.",
    image:
      "https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?auto=format&fit=crop&w=800&q=70",
  },
  {
    id: "manicure",
    title: "Маникюр с покрытием",
    category: "nails",
    durationMin: 120,
    price: 1100,
    currency: "Kč",
    description: "Аппаратный маникюр, гель-лак, уход за кутикулой.",
    image:
      "https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=800&q=70",
  },
  {
    id: "brows",
    title: "Брови и ресницы",
    category: "brows",
    durationMin: 60,
    price: 800,
    currency: "Kč",
    description: "Коррекция формы, окрашивание, ламинирование.",
    image:
      "https://images.unsplash.com/photo-1583001931096-959e9a1a6223?auto=format&fit=crop&w=800&q=70",
  },
];

export const categoryLabels: Record<Service["category"], string> = {
  hair: "Волосы",
  nails: "Ногти",
  brows: "Брови",
  care: "Уход",
};

export function getService(id: string | null) {
  return services.find((s) => s.id === id) ?? null;
}
