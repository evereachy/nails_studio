import type { BookingPayload, BookingRecord } from "@/types";

/**
 * Контракт хранилища. Сейчас — память процесса (MVP).
 * Дальше подменяется на Prisma / Supabase / Firebase без изменений в API-роуте.
 */
export interface BookingRepository {
  create(payload: BookingPayload): Promise<BookingRecord>;
  listByDate(dateISO: string): Promise<BookingRecord[]>;
}

const memory: BookingRecord[] = [];

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
    return memory.filter((b) => b.date === dateISO);
  },
};

export const bookingRepository: BookingRepository = inMemoryRepository;
