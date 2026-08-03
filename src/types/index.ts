/** Единые типы домена. Меняем здесь — TypeScript сам подсветит все места. */

export type ServiceCategory = "hair" | "nails" | "brows" | "care";

/**
 * Вариант услуги. Стрижка на короткие волосы — 60 минут,
 * на длинные — 120: это одна услуга с разной длительностью и ценой.
 * Именно вариант, а не услуга, попадает в бронь.
 */
export interface ServiceVariant {
  id: string;
  label: string;
  /** длительность в минутах — влияет на блокировку слотов */
  durationMin: number;
  price: number;
}

export interface Service {
  id: string;
  title: string;
  category: ServiceCategory;
  currency: string;
  description?: string;
  image: string;
  /** минимум один вариант */
  variants: ServiceVariant[];
}

export interface Master {
  id: string;
  name: string;
  role: string;
  avatar?: string;
  /** выключенный мастер не показывается в записи, но остаётся в истории */
  active: boolean;
  /** id услуг, которые мастер делает. Пустой массив = делает всё */
  serviceIds: string[];
  /** личные выходные: 0 = воскресенье ... 6 = суббота */
  weekdaysOff: number[];
}

export interface Review {
  id: string;
  name: string;
  avatar?: string;
  rating: 1 | 2 | 3 | 4 | 5;
  text: string;
  serviceTitle?: string;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export interface GalleryItem {
  id: string;
  src: string;
  alt: string;
}

/** Фото-референс, приложенный к записи. dataUrl уже сжат на клиенте. */
export interface BookingPhoto {
  id: string;
  name: string;
  /** data:image/jpeg;base64,... */
  dataUrl: string;
  /** размер после сжатия, байты */
  size: number;
}

/** Слот времени в формате "HH:mm" */
export type TimeSlot = string;

export interface SlotState {
  time: TimeSlot;
  available: boolean;
  /** причина недоступности — для тултипов и отладки */
  reason?: "booked" | "closed" | "past" | "duration";
}

/** Одна позиция в брони: услуга + выбранный вариант */
export interface BookingItem {
  serviceId: string;
  variantId: string;
}

/** Позиция вместе с раскрытыми данными — результат resolve */
export interface ResolvedItem {
  service: Service;
  variant: ServiceVariant;
}

/** Итог по корзине услуг */
export interface SelectionSummary {
  items: ResolvedItem[];
  durationMin: number;
  price: number;
  currency: string;
}

/** То, что заполняет пользователь */
export interface BookingDraft {
  items: BookingItem[];
  /** null = «любой мастер» */
  masterId: string | null;
  /** дата в формате YYYY-MM-DD */
  date: string | null;
  time: TimeSlot | null;
  name: string;
  phone: string;
  /** username в Telegram для уведомлений клиенту */
  telegram?: string;
  comment?: string;
  photos: BookingPhoto[];
}

/** Позиция в том виде, в каком она уходит на сервер и в чат */
export interface BookingLine {
  serviceId: string;
  variantId: string;
  serviceTitle: string;
  variantLabel: string;
  durationMin: number;
  price: number;
}

/** То, что уходит на сервер */
export interface BookingPayload {
  lines: BookingLine[];
  masterId: string | null;
  /** имя на момент записи — мастер может уволиться, история не поедет */
  masterName: string;
  /** сумма длительностей — столько времени занимает визит */
  totalDurationMin: number;
  totalPrice: number;
  currency: string;
  date: string;
  time: TimeSlot;
  name: string;
  phone: string;
  telegram?: string;
  comment?: string;
  photos: BookingPhoto[];
  source: "web";
}

export interface BookingRecord extends BookingPayload {
  id: string;
  createdAt: string;
  status: "new" | "confirmed" | "cancelled";
}

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; fields?: Record<string, string> };

/** Интервал работы салона в конкретный день недели */
export interface WorkingDay {
  /** 0 = воскресенье ... 6 = суббота */
  weekday: number;
  open: TimeSlot | null;
  close: TimeSlot | null;
}

/**
 * Настройки салона. Раньше были константами в коде,
 * теперь редактируются управляющей через админку и лежат в хранилище.
 */
export interface SalonSettings {
  workingHours: WorkingDay[];
  /** разовые выходные: праздники, отпуск. YYYY-MM-DD */
  closedDates: string[];
  /** шаг сетки слотов, минут */
  slotStepMin: number;
  /** на сколько дней вперёд открыта запись */
  horizonDays: number;
}

/** Всё, что нужно клиенту, чтобы посчитать слоты локально */
export interface ScheduleContext {
  settings: SalonSettings;
  /** уже разрешённая занятость: дата -> [[время начала, длительность]] */
  busy: Record<string, Array<[TimeSlot, number]>>;
}

/** Ответ /api/availability */
export interface AvailabilityResponse extends ScheduleContext {
  masters: Master[];
  masterId: string | null;
}
