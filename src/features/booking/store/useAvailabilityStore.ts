import { create } from "zustand";
import type { AvailabilityResponse } from "@/types";

interface AvailabilityState {
  // State
  data: AvailabilityResponse | null;
  loading: boolean;
  error: string | null;
  currentMasterId: string | null;

  // Actions
  load: (masterId: string | null) => Promise<void>;
  reload: () => Promise<void>;
}

export const useAvailabilityStore = create<AvailabilityState>((set, get) => ({
  data: null,
  loading: true,
  error: null,
  currentMasterId: null,

  load: async (masterId: string | null) => {
    set({ currentMasterId: masterId, loading: true, error: null });

    try {
      const query = masterId ? `?masterId=${encodeURIComponent(masterId)}` : "";
      const res = await fetch(`/api/availability${query}`, { cache: "no-store" });
      const json = await res.json();

      // Prevent race conditions if master selection changed mid-fetch
      if (get().currentMasterId !== masterId) return;

      if (json.ok) {
        set({ data: json.data, loading: false });
      } else {
        set({ error: json.error ?? "Schedule unavailable", loading: false });
      }
    } catch {
      if (get().currentMasterId === masterId) {
        set({ error: "Server connection failed", loading: false });
      }
    }
  },

  reload: () => get().load(get().currentMasterId),
}));
