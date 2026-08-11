import type { FaqItem, GalleryItem, Review } from "@/types";

export const reviews: Review[] = [
  {
    id: "r1",
    name: "Анна К.",
    rating: 5,
    serviceTitle: "Окрашивание",
    text: "Пришла с обломанным домашним осветлением. Мастер честно сказала, что за один раз не вытянем, расписала два визита. Так и вышло — теперь цвет ровный и волосы живые.",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=70",
  },
  {
    id: "r2",
    name: "Марина Д.",
    rating: 5,
    serviceTitle: "Стрижка",
    text: "Первый салон, где меня не уговаривали на каре. Спросили, сколько времени я реально готова тратить на укладку утром, и от этого отталкивались.",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=70",
  },
  {
    id: "r3",
    name: "Ольга П.",
    rating: 5,
    serviceTitle: "Маникюр",
    text: "Записалась онлайн в 23:40, подтверждение пришло утром. Пришла к 11:00 — меня уже ждали, никого в очереди.",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=70",
  },
  {
    id: "r4",
    name: "Катерина В.",
    rating: 4,
    serviceTitle: "Брови",
    text: "Форму сделали идеально. Единственное — хотелось бы больше вариантов по времени в субботу, всё разбирают за неделю.",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=70",
  },
];

export const faq: FaqItem[] = [
  {
    id: "f1",
    question: "Как быстро придёт подтверждение?",
    answer:
      "Заявка сразу попадает мастеру. В рабочие часы подтверждаем в течение 15 минут, вечером — утром следующего дня.",
  },
  {
    id: "f2",
    question: "Что если я опаздываю?",
    answer:
      "Позвоните нам. Держим место 15 минут, дальше сокращаем процедуру или переносим — зависит от записи следующего гостя.",
  },
  {
    id: "f3",
    question: "Можно отменить запись?",
    answer:
      "Да, бесплатно и без объяснений, если предупредить минимум за 4 часа. Предоплату не берём.",
  },
  {
    id: "f4",
    question: "Сколько стоит окрашивание, если волосы длинные?",
    answer:
      "Цена в прайсе — за среднюю длину. На длинные уходит больше состава, доплата 300–800 Kč. Мастер называет сумму до начала работы.",
  },
  {
    id: "f5",
    question: "Есть парковка?",
    answer:
      "Рядом синяя зона. Бесплатные места обычно есть во дворе со стороны Šrobárova.",
  },
];

export const gallery: GalleryItem[] = [
  { id: "g1", src: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=700&q=70", alt: "Рабочее место мастера" },
  { id: "g2", src: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=700&q=70", alt: "Окрашивание волос" },
  { id: "g3", src: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=700&q=70", alt: "Результат стрижки" },
  { id: "g4", src: "https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=700&q=70", alt: "Маникюр" },
  { id: "g5", src: "https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?auto=format&fit=crop&w=700&q=70", alt: "Укладка" },
  { id: "g6", src: "https://images.unsplash.com/photo-1470259078422-826894b933aa?auto=format&fit=crop&w=700&q=70", alt: "Интерьер студии" },
];
