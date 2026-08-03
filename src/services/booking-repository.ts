import type { BookingPayload, BookingRecord } from "@/types";

export interface BookingRepository {
  create(payload: BookingPayload): Promise<BookingRecord>;
  listByDate(dateISO: string): Promise<BookingRecord[]>;
  getById(id: string): Promise<BookingRecord | null>;
  cancel(id: string): Promise<BookingRecord | null>; // <-- Added
  reschedule(id: string, newDate: string, newTime: string): Promise<BookingRecord | null>; // <-- Added
}

const globalForBooking = globalThis as unknown as {
  bookingMemory: BookingRecord[];
};

const memory: BookingRecord[] = globalForBooking.bookingMemory ?? [];

if (process.env.NODE_ENV !== "production") {
  globalForBooking.bookingMemory = memory;
}

export const inMemoryRepository: BookingRepository = {
  async create(payload) {
    const record: BookingRecord = {
      ...payload,
      id: `BK-${Date.now().toString(36).toUpperCase()}`,
      createdAt: new Date().toISOString(),
      status: "new",
    };
    memory.push(record);
    return record;
  },

  async listByDate(dateISO) {
    return memory.filter((b) => b.date === dateISO && b.status !== "cancelled");
  },

  async getById(id) {
    return memory.find((b) => b.id === id) ?? null;
  },

  async cancel(id) {
    const booking = memory.find((b) => b.id === id);
    if (booking) {
      booking.status = "cancelled";
      return booking;
    }
    return null;
  },

  async reschedule(id, newDate, newTime) {
    const booking = memory.find((b) => b.id === id);
    if (booking) {
      booking.date = newDate;
      booking.time = newTime;
      booking.status = "confirmed";
      return booking;
    }
    return null;
  },
};

export const bookingRepository: BookingRepository = inMemoryRepository;
