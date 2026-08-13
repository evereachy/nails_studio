"use client";

import { Sheet } from "@/components/ui/Sheet";
import { BookingFlow } from "./BookingFlow";
import { useBookingStore } from "../store/useBookingStore";
import { RescheduleHandler } from "./RescheduleHandler"; // 1. Import handler

/**
 * Mobile slide-over sheet for the booking flow.
 * Mounted once at the page level.
 */
export function BookingSheet() {
  const isOpen = useBookingStore((s) => s.isOpen);
  const close = useBookingStore((s) => s.close);
  const step = useBookingStore((s) => s.step);

  return (
    <>
      {/* 2. Listens for ?reschedule= in URL and calls loadRescheduleBooking() */}
      <RescheduleHandler />

      <Sheet open={isOpen} onClose={close} title={step === 4 ? "Запись подтверждена" : "Запись"}>
        <BookingFlow className="h-full pt-1" />
      </Sheet>
    </>
  );
}
