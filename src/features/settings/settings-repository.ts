import { collections, getDb, isMongoEnabled } from "@/lib/db/mongodb";
import { defaultMasters, defaultSettings } from "@/config/schedule";
import type { Master, SalonSettings } from "@/types";

export interface SalonStore {
  settings: SalonSettings;
  masters: Master[];
  updatedAt: string;
}

export interface SettingsRepository {
  read(): Promise<SalonStore>;
  write(store: Pick<SalonStore, "settings" | "masters">): Promise<SalonStore>;
}

const DOC_ID = "salon";
type SettingsDoc = SalonStore & { _id: string };

let cache: SalonStore | null = null;

function fallback(): SalonStore {
  return {
    settings: defaultSettings,
    masters: defaultMasters,
    updatedAt: new Date(0).toISOString(),
  };
}

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
      console.error("[settings] Mongo read failed, falling back to default settings", e);
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

export function invalidateSettingsCache(): void {
  cache = null;
}
