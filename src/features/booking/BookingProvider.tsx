"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { BookingDraft, BookingItem, BookingRecord, ApiResult } from "@/types";
import { toggleItem } from "@/lib/selection";
import { postBooking } from "./api";

export type BookingStep = 1 | 2 | 3 | 4;

const emptyDraft: BookingDraft = {
  items: [],
  masterId: null,
  date: null,
  time: null,
  name: "",
  phone: "",
  comment: "",
  photos: [],
};

interface BookingContextValue {
  draft: BookingDraft;
  patch: (p: Partial<BookingDraft>) => void;
  toggle: (item: BookingItem) => void;
  step: BookingStep;
  goTo: (s: BookingStep) => void;
  isOpen: boolean;
  open: (s?: BookingStep) => void;
  close: () => void;
  status: "idle" | "sending" | "error";
  error: string | null;
  fieldErrors: Record<string, string>;
  result: BookingRecord | null;
  rescheduleId: string | null;
  submit: () => Promise<void>;
  reset: () => void;
}

const Ctx = createContext<BookingContextValue | null>(null);

export function BookingProvider({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const rescheduleParam = searchParams.get("reschedule");

  const [rescheduleId, setRescheduleId] = useState<string | null>(null);
  const [draft, setDraft] = useState<BookingDraft>(emptyDraft);
  const [step, setStep] = useState<BookingStep>(1);
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState<"idle" | "sending" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [result, setResult] = useState<BookingRecord | null>(null);

  // Automatically fetch existing booking if ?reschedule=BK-... is present in URL
  useEffect(() => {
    if (!rescheduleParam) return;

    async function loadBookingToReschedule(id: string) {
      setStatus("sending");
      try {
        const res = await fetch(`/api/book/${id}`);
        const data = await res.json();

        if (data.ok && data.data) {
          const b: BookingRecord = data.data;
          setRescheduleId(b.id);

          // Map lines -> items so the selection state is pre-filled
          const mappedItems: BookingItem[] = (b.lines ?? []).map((line) => ({
            serviceId: line.serviceId,
            variantId: line.variantId,
          }));

          setDraft({
            items: mappedItems,
            masterId: b.masterId ?? null,
            date: null, // Reset date so user picks a new slot
            time: null, // Reset time so user picks a new slot
            name: b.name ?? "",
            phone: b.phone ?? "",
            comment: b.comment ?? "",
            photos: b.photos ?? [],
          });

          setIsOpen(true);
          setStep(2); // Jump directly to Date & Time selection
        } else {
          setError(data.error ?? "Не удалось загрузить запись для переноса");
        }
      } catch (err) {
        console.error("Failed to load booking for rescheduling:", err);
        setError("Ошибка при загрузке данных записи");
      } finally {
        setStatus("idle");
      }
    }

    loadBookingToReschedule(rescheduleParam);
  }, [rescheduleParam]);

  const patch = useCallback((p: Partial<BookingDraft>) => {
    setDraft((prev) => ({ ...prev, ...p }));
    setFieldErrors({});
    setError(null);
  }, []);

  const toggle = useCallback((item: BookingItem) => {
    setDraft((prev) => ({
      ...prev,
      items: toggleItem(prev.items, item),
      time: null,
    }));
    setFieldErrors({});
    setError(null);
  }, []);

  const goTo = useCallback((s: BookingStep) => {
    setStep(s);
  }, []);

  const open = useCallback((s?: BookingStep) => {
    if (s) setStep(s);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const reset = useCallback(() => {
    setDraft(emptyDraft);
    setStep(1);
    setStatus("idle");
    setError(null);
    setFieldErrors({});
    setResult(null);
    setRescheduleId(null);
  }, []);

  const submit = useCallback(async () => {
    setStatus("sending");
    setError(null);
    setFieldErrors({});

    try {
      // 1. Reschedule action (PATCH)
      if (rescheduleId) {
        const res = await fetch(`/api/book/${rescheduleId}/reschedule`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            date: draft.date,
            time: draft.time,
          }),
        });

        const resData: ApiResult<BookingRecord> = await res.json();

        if (resData.ok) {
          setResult(resData.data);
          setStatus("idle");
          setStep(4); // StepDone
        } else {
          setStatus("error");
          setError(resData.error ?? "Не удалось перенести запись.");
        }
        return;
      }

      // 2. Standard New Booking action (POST)
      const res: ApiResult<BookingRecord> = await postBooking(draft);

      if (res.ok) {
        setResult(res.data);
        setStatus("idle");
        setStep(4);
      } else {
        setStatus("error");
        if (res.fields) setFieldErrors(res.fields);
        setError(res.error ?? "Не удалось отправить запись. Проверьте данные.");
      }
    } catch (e) {
      console.error("[BookingSubmitError]", e);
      setStatus("error");
      setError("Произошла ошибка при отправке. Попробуйте еще раз.");
    }
  }, [draft, rescheduleId]);

  const value = useMemo(
    () => ({
      draft,
      patch,
      toggle,
      step,
      goTo,
      isOpen,
      open,
      close,
      status,
      error,
      fieldErrors,
      result,
      rescheduleId,
      submit,
      reset,
    }),
    [
      draft,
      patch,
      toggle,
      step,
      goTo,
      isOpen,
      open,
      close,
      status,
      error,
      fieldErrors,
      result,
      rescheduleId,
      submit,
      reset,
    ]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useBooking() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useBooking должен вызываться внутри <BookingProvider>");
  return ctx;
}
