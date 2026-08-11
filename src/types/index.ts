/** Single domain source of truth for types. */

export type ServiceCategory = "hair" | "nails" | "brows" | "care";

/**
 * Service variant. Haircut for short hair (60 min) vs long hair (120 min):
 * this represents one service with different duration and price options.
 */
export interface ServiceVariant {
  id: string;
  label: string;
  /** Duration in minutes - directly impacts slot blocking */
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
  /** At least one variant required */
  variants: ServiceVariant[];
}

export interface Master {
  id: string;
  name: string;
  role: string;
  avatar?: string;
  /** Inactive masters are hidden from new bookings but preserved in history */
  active: boolean;
  /** IDs of services this master performs. Empty array = performs all services */
  serviceIds: string[];
  /** Personal days off: 0 = Sunday, 1 = Monday ... 6 = Saturday */
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
  answer: React.ReactNode;
}

export interface GalleryItem {
  id: string;
  src: string;
  alt: string;
}

/** Photo reference attached to a booking. dataUrl is pre-compressed on the client. */
export interface BookingPhoto {
  id: string;
  name: string;
  /** data:image/jpeg;base64,... */
  dataUrl: string;
  /** Post-compression file size in bytes */
  size: number;
}

/** Time slot format "HH:mm" */
export type TimeSlot = string;

export interface SlotState {
  time: TimeSlot;
  available: boolean;
  /** Reason for unavailability — used for debugging & UI tooltips */
  reason?: "booked" | "closed" | "past" | "duration";
}

/** Single selected service item in booking selection */
export interface BookingItem {
  serviceId: string;
  variantId: string;
}

/** Resolved service item with populated domain details */
export interface ResolvedItem {
  service: Service;
  variant: ServiceVariant;
}

/** Summary calculation for selected cart items */
export interface SelectionSummary {
  items: ResolvedItem[];
  durationMin: number;
  price: number;
  currency: string;
}

/** Draft state populated by the client form */
export interface BookingDraft {
  items: BookingItem[];
  masterId: string | null;
  date: string | null;
  time: TimeSlot | null;
  name: string;
  phone: string;
  email: string;
  telegram?: string;
  comment?: string;
  photos: BookingPhoto[];
}

/** Item line formatted for API payload and notification channels */
export interface BookingLine {
  serviceId: string;
  variantId: string;
  serviceTitle: string;
  variantLabel: string;
  durationMin: number;
  price: number;
}

/** Payload dispatched to backend */
export interface BookingPayload {
  lines: BookingLine[];
  masterId: string | null;
  masterName: string;
  totalDurationMin: number;
  totalPrice: number;
  currency: string;
  date: string;
  time: TimeSlot;
  name: string;
  phone: string;
  email: string;
  telegram?: string;
  comment?: string;
  photos: BookingPhoto[];
  source: "web";
}

export interface BookingRecord extends BookingPayload {
  id: string;
  photoIds?: string[];
  createdAt: string;
  status: "new" | "confirmed" | "cancelled";
}

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; fields?: Record<string, string> };

/** Salon working hours interval for a specific weekday */
export interface WorkingDay {
  /** 0 = Sunday ... 6 = Saturday */
  weekday: number;
  open: TimeSlot | null;
  close: TimeSlot | null;
}

/** Salon operational settings stored in DB/repository */
export interface SalonSettings {
  workingHours: WorkingDay[];
  /** Specific closure dates (holidays, special off-days): YYYY-MM-DD */
  closedDates: string[];
  /** Slot step interval in minutes */
  slotStepMin: number;
  /** Days ahead booking window is open */
  horizonDays: number;
}

/** Context required to compute available slots on the client/server */
export interface ScheduleContext {
  settings: SalonSettings;
  /** Resolved busy intervals: Date string (YYYY-MM-DD) -> [[startTime, durationMinutes]] */
  busy: Record<string, Array<[TimeSlot, number]>>;
}

/** Response shape for /beauty/api/availability */
export interface AvailabilityResponse extends ScheduleContext {
  masters: Master[];
  masterId: string | null;
}
