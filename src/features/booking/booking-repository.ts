import { collections, ensureIndexes, getDb, isMongoEnabled } from "@/lib/db/mongodb";
import { photoRepository } from "@/features/booking/photo-repository";
import type { BookingPayload, BookingRecord } from "@/types";

export interface BookingRepository {
  create(payload: BookingPayload): Promise<BookingRecord>;
  listByDate(dateISO: string): Promise<BookingRecord[]>;
  listAll(limit?: number): Promise<BookingRecord[]>;
  setStatus(id: string, status: BookingRecord["status"]): Promise<BookingRecord | null>;
  getById(id: string): Promise<BookingRecord | null>;
  cancel(id: string): Promise<BookingRecord | null>;
  reschedule(id: string, newDate: string, newTime: string): Promise<BookingRecord | null>;
}

function newRecord(payload: BookingPayload): BookingRecord {
  return {
    ...payload,
    id: `BK-${Date.now().toString(36).toUpperCase()}`,
    createdAt: new Date().toISOString(),
    status: "new",
  };
}

/* ------------------------------- MongoDB -------------------------------- */

const mongoRepository: BookingRepository = {
  async create(payload) {
    await ensureIndexes();
    const db = await getDb();
    const record = newRecord(payload);

    const { photos, ...rest } = record;
    const photoIds = await photoRepository.saveMany(record.id, photos);

    await db.collection(collections.bookings).insertOne({
      ...rest,
      photoCount: photos ? photos.length : 0,
    });

    return { ...record, photoIds };
  },

  async listByDate(dateISO) {
    const db = await getDb();
    return db
      .collection<BookingRecord>(collections.bookings)
      .find({ date: dateISO, status: { $ne: "cancelled" } }, { projection: { _id: 0 } })
      .sort({ time: 1 })
      .toArray();
  },

  async listAll(limit = 500) {
    const db = await getDb();
    return db
      .collection<BookingRecord>(collections.bookings)
      .find({}, { projection: { _id: 0 } })
      .sort({ date: 1, time: 1 })
      .limit(limit)
      .toArray();
  },

  async setStatus(id, status) {
    const db = await getDb();
    const res = await db
      .collection<BookingRecord>(collections.bookings)
      .findOneAndUpdate(
        { id },
        { $set: { status } },
        { returnDocument: "after", projection: { _id: 0 } },
      );
    return res ?? null;
  },

  async getById(id) {
    const db = await getDb();
    return db
      .collection<BookingRecord>(collections.bookings)
      .findOne({ id }, { projection: { _id: 0 } });
  },

  async cancel(id) {
    return mongoRepository.setStatus(id, "cancelled");
  },

  async reschedule(id, newDate, newTime) {
    const db = await getDb();
    const res = await db
      .collection<BookingRecord>(collections.bookings)
      .findOneAndUpdate(
        { id },
        { $set: { date: newDate, time: newTime, status: "new" } },
        { returnDocument: "after", projection: { _id: 0 } },
      );
    return res ?? null;
  },
};

/* -------------------------------- Memory -------------------------------- */

const globalForBooking = globalThis as unknown as { bookingMemory?: BookingRecord[] };
const memory: BookingRecord[] = globalForBooking.bookingMemory ?? [];

if (process.env.NODE_ENV !== "production") {
  globalForBooking.bookingMemory = memory;
}

export const inMemoryRepository: BookingRepository = {
  async create(payload) {
    const record = newRecord(payload);
    const photoIds = await photoRepository.saveMany(record.id, record.photos);
    const stored = { ...record, photoIds };
    memory.push(stored);
    return stored;
  },

  async listByDate(dateISO) {
    return memory.filter((b) => b.date === dateISO && b.status !== "cancelled");
  },

  async getById(id) {
    return memory.find((b) => b.id === id) ?? null;
  },

  async cancel(id) {
    return inMemoryRepository.setStatus(id, "cancelled");
  },

  async reschedule(id, newDate, newTime) {
    const booking = memory.find((b) => b.id === id);
    if (!booking) return null;
    booking.date = newDate;
    booking.time = newTime;
    booking.status = "new";
    return booking;
  },

  async listAll(limit = 500) {
    return [...memory]
      .sort((a, b) => (a.date + a.time < b.date + b.time ? -1 : 1))
      .slice(0, limit);
  },

  async setStatus(id, status) {
    const record = memory.find((b) => b.id === id);
    if (!record) return null;
    record.status = status;
    return record;
  },
};

export const bookingRepository: BookingRepository = isMongoEnabled
  ? mongoRepository
  : inMemoryRepository;
