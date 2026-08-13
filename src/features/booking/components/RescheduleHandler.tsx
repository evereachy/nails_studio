"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useBookingStore } from "../store/useBookingStore";

export function RescheduleHandler() {
  const searchParams = useSearchParams();
  const loadRescheduleBooking = useBookingStore((s) => s.loadRescheduleBooking);
  const loadedRef = useRef<string | null>(null);

  useEffect(() => {
    const rescheduleId = searchParams.get("reschedule");

    // Check if reschedule ID exists and prevent duplicate runs in Strict Mode
    if (rescheduleId && loadedRef.current !== rescheduleId) {
      loadedRef.current = rescheduleId;
      loadRescheduleBooking(rescheduleId);
    }
  }, [searchParams, loadRescheduleBooking]);

  return null;
}
