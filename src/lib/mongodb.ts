import { MongoClient, type Db } from "mongodb";

const URI = process.env.MONGODB_URI ?? "";
const DB_NAME = process.env.MONGODB_DB ?? "nails_studio";

/**
 * Одно подключение на процесс.
 *
 * В dev-режиме Next пересобирает модули при каждом сохранении файла, и без
 * кэша в globalThis каждый hot-reload открывал бы новый пул соединений —
 * через десяток правок Atlas упрётся в лимит и начнёт отбивать запросы.
 * В проде та же переменная переживает переиспользование warm-инстанса.
 */
const globalForMongo = globalThis as unknown as {
  _mongoClientPromise?: Promise<MongoClient>;
};

export const isMongoEnabled = Boolean(URI);

function clientPromise(): Promise<MongoClient> {
  if (!URI) throw new Error("MONGODB_URI не задан");

  if (!globalForMongo._mongoClientPromise) {
    const client = new MongoClient(URI, {
      serverSelectionTimeoutMS: 5000,
      maxPoolSize: 10,
    });

    // Промис кэшируем, но отклонённый — сбрасываем. Иначе одна неудача
    // при холодном старте залипает в globalThis, и warm-инстанс продолжает
    // отдавать старую ошибку даже после того, как база снова доступна.
    globalForMongo._mongoClientPromise = client.connect().catch((e) => {
      globalForMongo._mongoClientPromise = undefined;
      throw e;
    });
  }

  return globalForMongo._mongoClientPromise;
}

export async function getDb(): Promise<Db> {
  const client = await clientPromise();
  return client.db(DB_NAME);
}

/** Коллекции в одном месте — чтобы не искать строковые литералы по проекту */
export const collections = {
  bookings: "bookings",
  settings: "settings",
} as const;

let indexesReady: Promise<void> | null = null;

/**
 * Индексы создаются один раз за жизнь процесса.
 * По дате мы ходим на каждый расчёт доступности — без индекса это full scan
 * коллекции, которая растёт линейно с числом записей.
 */
export async function ensureIndexes() {
  if (!indexesReady) {
    indexesReady = (async () => {
      const db = await getDb();
      await db.collection(collections.bookings).createIndexes([
        { key: { date: 1, masterId: 1 }, name: "date_master" },
        { key: { id: 1 }, name: "public_id", unique: true },
        { key: { createdAt: -1 }, name: "recent" },
      ]);
    })().catch((e) => {
      indexesReady = null;
      throw e;
    });
  }
  return indexesReady;
}
