import { Binary } from "mongodb";
import { collections, getDb, isMongoEnabled } from "@/lib/db/mongodb";
import type { BookingPhoto } from "@/types";

export interface StoredPhoto {
  id: string;
  bookingId: string;
  name: string;
  mime: string;
  size: number;
  bytes: Buffer;
}

export interface PhotoRepository {
  saveMany(bookingId: string, photos: BookingPhoto[]): Promise<string[]>;
  get(id: string): Promise<StoredPhoto | null>;
  getIdsForBooking(bookingId: string): Promise<string[]>;
}

export function decodeDataUrl(dataUrl: string) {
  const comma = dataUrl.indexOf(",");
  const mime = /^data:([^;]+);/.exec(dataUrl)?.[1] ?? "image/jpeg";
  const bytes = Buffer.from(dataUrl.slice(comma + 1), "base64");
  return { mime, bytes };
}

function photoId(bookingId: string, index: number): string {
  const rand = typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID().slice(0, 6)
    : Math.random().toString(36).slice(2, 8);
  return `${bookingId}-${index}-${rand}`;
}

/* ------------------------------- MongoDB -------------------------------- */

const mongoRepository: PhotoRepository = {
  async saveMany(bookingId, photos) {
    if (!photos.length) return [];

    const db = await getDb();
    const docs = photos.map((p, i) => {
      const { mime, bytes } = decodeDataUrl(p.dataUrl);
      return {
        _id: photoId(bookingId, i),
        bookingId,
        name: p.name,
        mime,
        size: bytes.length,
        data: new Binary(bytes),
        createdAt: new Date().toISOString(),
      };
    });

    await db.collection(collections.photos).insertMany(docs as never[]);
    await db.collection(collections.photos).createIndex({ bookingId: 1 });

    return docs.map((d) => d._id);
  },

  async get(id) {
    const db = await getDb();
    const doc = await db.collection(collections.photos).findOne({ _id: id as never });
    if (!doc) return null;

    return {
      id,
      bookingId: doc.bookingId,
      name: doc.name,
      mime: doc.mime,
      size: doc.size,
      bytes: Buffer.from(doc.data.buffer),
    };
  },

  async getIdsForBooking(bookingId) {
    const db = await getDb();
    const docs = await db
      .collection(collections.photos)
      .find({ bookingId })
      .project({ _id: 1 })
      .toArray();

    return docs.map((d) => d._id as unknown as string);
  },
};

/* -------------------------------- Memory -------------------------------- */

const globalForPhotos = globalThis as unknown as { photoMemory?: Map<string, StoredPhoto> };
const memory = globalForPhotos.photoMemory ?? new Map<string, StoredPhoto>();

if (process.env.NODE_ENV !== "production") globalForPhotos.photoMemory = memory;

const inMemoryRepository: PhotoRepository = {
  async saveMany(bookingId, photos) {
    return photos.map((p, i) => {
      const id = photoId(bookingId, i);
      const { mime, bytes } = decodeDataUrl(p.dataUrl);
      memory.set(id, { id, bookingId, name: p.name, mime, size: bytes.length, bytes });
      return id;
    });
  },

  async get(id) {
    return memory.get(id) ?? null;
  },

  async getIdsForBooking(bookingId) {
    const ids: string[] = [];
    for (const photo of memory.values()) {
      if (photo.bookingId === bookingId) {
        ids.push(photo.id);
      }
    }
    return ids;
  },
};

export const photoRepository: PhotoRepository = isMongoEnabled
  ? mongoRepository
  : inMemoryRepository;;
