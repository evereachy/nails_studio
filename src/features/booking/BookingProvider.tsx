"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { BookingDraft, BookingRecord } from "@/types";
import { postBooking } from "./api";

export type BookingStep = 1 | 2 | 3 | 4;

const emptyDraft: BookingDraft = {
  serviceId: null,
  date: null,
  time: null,
  name: "",
  phone: "",
  comment: "",
};

interface BookingContextValue {
  draft: BookingDraft;
  patch: (p: Partial<BookingDraft>) => void;
  step: BookingStep;
  goTo: (s: BookingStep) => void;
  isOpen: boolean;
  open: (s?: BookingStep) => void;
  close: () => void;
  status: "idle" | "sending" | "error";
  error: string | null;
  fieldErrors: Record<string, string>;
  result: BookingRecord | null;
  submit: () => Promise<void>;
  reset: () => void;
}

const Ctx = createContext<BookingContextValue | null>(null);

/**
 * Одно состояние записи на всё приложение.
 * Поэтому hero-карточка, секция «Запись» и мобильная нижняя панель
 * ведут пользователя по одному и тому же сценарию, не теряя выбор.
 */
export function BookingProvider({ children }: { children: React.ReactNode }) {
  const [draft, setDraft] = useState<BookingDraft>(emptyDraft);
  const [step, setStep] = useState<BookingStep>(1);
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState<"idle" | "sending" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [result, setResult] = useState<BookingRecord | null>(null);

  const patch = useCallback((p: Partial<BookingDraft>) => {
    setDraft((d) => ({ ...d, ...p }));
    setFieldErrors({});
  }, []);

  const open = useCallback((s: BookingStep = 1) => {
    setStep(s);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => setIsOpen(false), []);

  const reset = useCallback(() => {
    setDraft(emptyDraft);
    setStep(1);
    setStatus("idle");
    setError(null);
    setFieldErrors({});
    setResult(null);
  }, []);

  const submit = useCallback(async () => {
    setStatus("sending");
    setError(null);
    setFieldErrors({});

    const res = await postBooking(draft);

    if (res.ok) {
      setResult(res.data);
      setStatus("idle");
      setStep(4);
    } else {
      setStatus("error");
      setError(res.error);
      setFieldErrors(res.fields ?? {});
      // возвращаем на шаг, где ошибка
      if (res.fields?.serviceId) setStep(1);
      else if (res.fields?.date || res.fields?.time) setStep(2);
    }
  }, [draft]);

  const value = useMemo(
    () => ({
      draft, patch, step, goTo: setStep, isOpen, open, close,
      status, error, fieldErrors, result, submit, reset,
    }),
    [draft, patch, step, isOpen, open, close, status, error, fieldErrors, result, submit, reset],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useBooking() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useBooking должен вызываться внутри <BookingProvider>");
  return ctx;
}
