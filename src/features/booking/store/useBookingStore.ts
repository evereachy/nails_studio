import { create } from "zustand";
import type { BookingDraft, BookingItem, BookingRecord, ApiResult } from "@/types";
import { toggleItem } from "@/features/booking/selection";
import { postBooking } from "../api";

export type BookingStep = 1 | 2 | 3 | 4;

const emptyDraft: BookingDraft = {
  items: [],
  masterId: null,
  date: null,
  time: null,
  name: "",
  phone: "",
  email: "",
  comment: "",
  photos: [],
};

interface BookingState {
  // State
  draft: BookingDraft;
  step: BookingStep;
  isOpen: boolean;
  status: "idle" | "sending" | "error";
  error: string | null;
  fieldErrors: Record<string, string>;
  result: BookingRecord | null;
  rescheduleId: string | null;

  // Actions
  patch: (p: Partial<BookingDraft>) => void;
  toggle: (item: BookingItem) => void;
  goTo: (s: BookingStep) => void;
  open: (s?: BookingStep) => void;
  close: () => void;
  reset: () => void;

  // Async Actions
  loadRescheduleBooking: (id: string) => Promise<void>;
  submit: () => Promise<void>;
}

export const useBookingStore = create<BookingState>((set, get) => ({
  draft: emptyDraft,
  step: 1,
  isOpen: false,
  status: "idle",
  error: null,
  fieldErrors: {},
  result: null,
  rescheduleId: null,

  patch: (p) =>
    set((state) => ({
      draft: { ...state.draft, ...p },
      fieldErrors: {},
      error: null,
    })),

  toggle: (item) =>
    set((state) => ({
      draft: {
        ...state.draft,
        items: toggleItem(state.draft.items, item),
        time: null,
      },
      fieldErrors: {},
      error: null,
    })),

  goTo: (step) => set({ step }),
  open: (step) => set((state) => ({ isOpen: true, step: step ?? state.step })),
  close: () => set({ isOpen: false }),

  reset: () =>
    set({
      draft: emptyDraft,
      step: 1,
      status: "idle",
      error: null,
      fieldErrors: {},
      result: null,
      rescheduleId: null,
    }),

  loadRescheduleBooking: async (id) => {
    set({ status: "sending", error: null });
    try {
      const res = await fetch(`/api/book/${id}`);
      const data = await res.json();

      if (data.ok && data.data) {
        const b: BookingRecord = data.data;
        const mappedItems: BookingItem[] = (b.lines ?? []).map((line) => ({
          serviceId: line.serviceId,
          variantId: line.variantId,
        }));

        set({
          rescheduleId: b.id,
          draft: {
            items: mappedItems,
            masterId: b.masterId ?? null,
            date: null,
            time: null,
            name: b.name ?? "",
            phone: b.phone ?? "",
            email: b.email ?? "",
            comment: b.comment ?? "",
            photos: b.photos ?? [],
          },
          isOpen: true,
          step: 2,
          status: "idle",
        });
      } else {
        set({
          error: data.error ?? "Failed to load booking for reschedule",
          status: "idle",
        });
      }
    } catch {
      set({ error: "Connection error", status: "idle" });
    }
  },

  submit: async () => {
    const { draft, rescheduleId } = get();
    set({ status: "sending", error: null, fieldErrors: {} });

    try {
      if (rescheduleId) {
        const res = await fetch(`/api/book/${rescheduleId}/reschedule`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ date: draft.date, time: draft.time }),
        });
        const resData: ApiResult<BookingRecord> = await res.json();

        if (resData.ok) {
          set({ result: resData.data, status: "idle", step: 4 });
        } else {
          set({ status: "error", error: resData.error ?? "Failed to reschedule" });
        }
        return;
      }

      const res = await postBooking(draft);
      if (res.ok) {
        set({ result: res.data, status: "idle", step: 4 });
      } else {
        set({
          status: "error",
          fieldErrors: res.fields ?? {},
          error: res.error ?? "Failed to send booking.",
        });
      }
    } catch {
      set({ status: "error", error: "An unexpected error occurred." });
    }
  },
}));
