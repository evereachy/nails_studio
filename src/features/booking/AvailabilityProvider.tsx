"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { AvailabilityResponse } from "@/types";

interface Value {
  data: AvailabilityResponse | null;
  loading: boolean;
  error: string | null;
  /** перезагрузить под другого мастера */
  load: (masterId: string | null) => void;
  reload: () => void;
}

const Ctx = createContext<Value | null>(null);

/**
 * График живёт на сервере и меняется управляющей, поэтому клиент его
 * загружает, а не берёт из бандла. Одним запросом получаем и рабочие часы,
 * и занятость на весь горизонт — дальше сетка слотов считается локально,
 * без похода на сервер при каждом тапе по дате.
 */
export function AvailabilityProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AvailabilityResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const currentMaster = useRef<string | null>(null);

  const load = useCallback(async (masterId: string | null) => {
    currentMaster.current = masterId;
    setLoading(true);
    setError(null);

    try {
      const qs = masterId ? `?masterId=${encodeURIComponent(masterId)}` : "";
      const res = await fetch(`/api/availability${qs}`, { cache: "no-store" });
      const json = await res.json();

      // Пока шёл запрос, мог смениться мастер — старый ответ игнорируем
      if (currentMaster.current !== masterId) return;

      if (json.ok) setData(json.data);
      else setError(json.error ?? "Расписание недоступно");
    } catch {
      if (currentMaster.current === masterId) setError("Нет связи с сервером");
    } finally {
      if (currentMaster.current === masterId) setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(null);
  }, [load]);

  const reload = useCallback(() => load(currentMaster.current), [load]);

  return (
    <Ctx.Provider value={{ data, loading, error, load, reload }}>{children}</Ctx.Provider>
  );
}

export function useAvailability() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAvailability должен вызываться внутри <AvailabilityProvider>");
  return ctx;
}
