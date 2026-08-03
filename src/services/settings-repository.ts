import { collections, getDb, isMongoEnabled } from "@/lib/mongodb";
import { defaultMasters, defaultSettings } from "@/config/schedule";
import type { Master, SalonSettings } from "@/types";

export interface SalonStore {
  settings: SalonSettings;
  masters: Master[];
  updatedAt: string;
}

/**
 * Настройки салона — один документ с фиксированным _id.
 * Их читает почти каждый запрос, поэтому держим в памяти процесса
 * и сбрасываем кэш при записи из админки.
 */
export interface SettingsRepository {
  read(): Promise<SalonStore>;
  write(store: Pick<SalonStore, "settings" | "masters">): Promise<SalonStore>;
}

const DOC_ID = "salon";

/** Документ настроек с человекочитаемым _id вместо ObjectId */
type SettingsDoc = SalonStore & { _id: string };

let cache: SalonStore | null = null;

function fallback(): SalonStore {
  return {
    settings: defaultSettings,
    masters: defaultMasters,
    updatedAt: new Date(0).toISOString(),
  };
}

/** Мягкое слияние: новое поле в коде не ломает уже сохранённый документ */
function merge(doc: Partial<SalonStore> | null): SalonStore {
  return {
    settings: { ...defaultSettings, ...(doc?.settings ?? {}) },
    masters: doc?.masters?.length ? doc.masters : defaultMasters,
    updatedAt: doc?.updatedAt ?? new Date().toISOString(),
  };
}

const mongoRepository: SettingsRepository = {
  async read() {
    if (cache) return cache;

    try {
      const db = await getDb();
      const doc = await db.collection<SettingsDoc>(collections.settings).findOne({ _id: DOC_ID });

      cache = merge(doc);
    } catch (e) {
      // База недоступна — салон продолжает принимать записи по дефолтному графику.
      console.error("[settings] чтение из Mongo не удалось, беру значения по умолчанию", e);
      cache = fallback();
    }

    return cache;
  },

  async write({ settings, masters }) {
    const store: SalonStore = { settings, masters, updatedAt: new Date().toISOString() };

    const db = await getDb();
    await db
      .collection<SettingsDoc>(collections.settings)
      .updateOne({ _id: DOC_ID }, { $set: store }, { upsert: true });

    cache = store;
    return store;
  },
};

/** Без базы правки живут до перезапуска — годится для демо, не для продакшена */
const memoryRepository: SettingsRepository = {
  async read() {
    cache ??= fallback();
    return cache;
  },
  async write({ settings, masters }) {
    cache = { settings, masters, updatedAt: new Date().toISOString() };
    return cache;
  },
};

export const settingsRepository: SettingsRepository = isMongoEnabled
  ? mongoRepository
  : memoryRepository;

/** Вызывается после записи из админки в другом инстансе */
export function invalidateSettingsCache() {
  cache = null;
}
