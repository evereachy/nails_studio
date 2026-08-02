"use client";

import { Sheet } from "@/components/ui/Sheet";
import { BookingFlow } from "./BookingFlow";
import { useBooking } from "./BookingProvider";

/** Шторка записи. Монтируется один раз в layout страницы. */
export function BookingSheet() {
  const { isOpen, close, step } = useBooking();

  return (
    <Sheet open={isOpen} onClose={close} title={step === 4 ? "Запись подтверждена" : "Запись"}>
      <BookingFlow className="h-full pt-1" />
    </Sheet>
  );
}
