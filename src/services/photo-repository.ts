import { Binary } from "mongodb";
import { collections, getDb, isMongoEnabled } from "@/lib/mongodb";
import type { BookingPhoto } from "@/types";

export interface StoredPhoto {
  id: string;
  bookingId: string;
  name: string;
  mime: string;
  size: number;
  bytes: Buffer;
}

/**
 * Фото хранятся отдельно от записи.
 *
 * Причина: три снимка по 400 КБ в base64 внутри документа брони съедают
 * заметную часть лимита в 16 МБ, а главное — попадают в каждую выдачу
 * списка записей в админке. Отдельная коллекция + ленивая загрузка
 * по одному изображению решает и то, и другое.
 */
export interface PhotoRepository {
  saveMany(bookingId: string, photos: BookingPhoto[]): Promise<string[]>;
  get(id: string): Promise<StoredPhoto | null>;
}

/** data:image/jpeg;base64,... -> { mime, bytes } */
export function decodeDataUrl(dataUrl: string) {
  const comma = dataUrl.indexOf(",");
  const mime = /^data:([^;]+);/.exec(dataUrl)?.[1] ?? "image/jpeg";
  const bytes = Buffer.from(dataUrl.slice(comma + 1), "base64");
  return { mime, bytes };
}

function photoId(bookingId: string, index: number) {
  return `${bookingId}-${index}-${Math.random().toString(36).slice(2, 8)}`;
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
        // Binary вместо base64: на диске на треть компактнее
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
};

/* -------------------------------- Память -------------------------------- */

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
};

export const photoRepository: PhotoRepository = isMongoEnabled
  ? mongoRepository
  : inMemoryRepository;
