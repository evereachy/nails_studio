import type { Service } from "@/types";

/**
 * КАТАЛОГ УСЛУГ — mock-данные.
 *
 * У каждой услуги минимум один вариант. Вариант — это связка
 * «длительность + цена»: маникюр без покрытия занимает час,
 * с дизайном — два с половиной, и мастеру нужно знать это до визита,
 * иначе расписание поедет.
 *
 * Позже заменяется на fetch из БД. Форма объекта остаётся той же.
 */
export const services: Service[] = [
  {
    id: "haircut",
    title: "Стрижка",
    category: "hair",
    currency: "Kč",
    description: "Консультация, мытьё, стрижка и укладка.",
    image:
      "https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=800&q=70",
    variants: [
      { id: "short", label: "Короткие волосы", durationMin: 60, price: 900 },
      { id: "medium", label: "Средние волосы", durationMin: 90, price: 1200 },
      { id: "long", label: "Длинные волосы", durationMin: 120, price: 1500 },
    ],
  },
  {
    id: "coloring",
    title: "Окрашивание",
    category: "hair",
    currency: "Kč",
    description: "Подбор тона, окрашивание, уход и укладка.",
    image:
      "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=70",
    variants: [
      { id: "toning", label: "Тонирование", durationMin: 120, price: 2400 },
      { id: "single", label: "В один тон", durationMin: 180, price: 3400 },
      { id: "complex", label: "Сложное окрашивание", durationMin: 240, price: 5200 },
    ],
  },
  {
    id: "styling",
    title: "Укладка",
    category: "hair",
    currency: "Kč",
    description: "Вечерняя или повседневная.",
    image:
      "https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?auto=format&fit=crop&w=800&q=70",
    variants: [
      { id: "daily", label: "Повседневная", durationMin: 45, price: 700 },
      { id: "evening", label: "Вечерняя", durationMin: 90, price: 1400 },
    ],
  },
  {
    id: "manicure",
    title: "Маникюр",
    category: "nails",
    currency: "Kč",
    description: "Аппаратный маникюр, уход за кутикулой, покрытие.",
    image:
      "https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=800&q=70",
    variants: [
      { id: "plain", label: "Без покрытия", durationMin: 60, price: 700 },
      { id: "gel", label: "С гель-лаком", durationMin: 120, price: 1100 },
      { id: "design", label: "С дизайном", durationMin: 150, price: 1500 },
      { id: "extension", label: "Наращивание", durationMin: 180, price: 2200 },
    ],
  },
  {
    id: "brows",
    title: "Брови и ресницы",
    category: "brows",
    currency: "Kč",
    description: "Коррекция формы, окрашивание, ламинирование.",
    image:
      "https://images.unsplash.com/photo-1583001931096-959e9a1a6223?auto=format&fit=crop&w=800&q=70",
    variants: [
      { id: "shape", label: "Коррекция бровей", durationMin: 30, price: 500 },
      { id: "tint", label: "Коррекция и окрашивание", durationMin: 60, price: 800 },
      { id: "lamination", label: "Ламинирование", durationMin: 90, price: 1300 },
    ],
  },
];

export const categoryLabels: Record<Service["category"], string> = {
  hair: "Волосы",
  nails: "Ногти",
  brows: "Брови",
  care: "Уход",
};

export function getService(id: string | null | undefined) {
  return services.find((s) => s.id === id) ?? null;
}

export function getVariant(serviceId: string, variantId: string) {
  return getService(serviceId)?.variants.find((v) => v.id === variantId) ?? null;
}

/** Самый дешёвый вариант — для витрины «от 700 Kč» */
export function minPrice(service: Service) {
  return Math.min(...service.variants.map((v) => v.price));
}

/** Вариант по умолчанию для быстрого старта из Hero и карточек услуг */
export function defaultVariant(service: Service) {
  return service.variants[Math.min(1, service.variants.length - 1)];
}
