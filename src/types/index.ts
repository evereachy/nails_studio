/** Единые типы домена. Меняем здесь — TypeScript сам подсветит все места. */

export type ServiceCategory = "hair" | "nails" | "brows" | "care";

export interface Service {
  id: string;
  title: string;
  category: ServiceCategory;
  /** длительность в минутах — влияет на блокировку слотов */
  durationMin: number;
  price: number;
  currency: string;
  description?: string;
  image: string;
}

export interface Master {
  id: string;
  name: string;
  role: string;
  avatar?: string;
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
//  Фото-референс, приложенный к записи. dataUrl уже сжат на клиенте. */
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

/** То, что заполняет пользователь */
export interface BookingDraft {
  serviceId: string | null;
  /** дата в формате YYYY-MM-DD */
  date: string | null;
  time: TimeSlot | null;
  name: string;
  phone: string;
  comment?: string;
photos: BookingPhoto[];
}

/** То, что уходит на сервер */
export interface BookingPayload {
  serviceId: string;
  serviceTitle: string;
  durationMin: number;
  price: number;
  currency: string;
  date: string;
  time: TimeSlot;
  name: string;
  phone: string;
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

