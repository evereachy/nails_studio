"use client";

import { site } from "@/config/site";
import { formatDateLong } from "@/lib/format";
import { useBooking } from "../BookingProvider";

export function StepDone() {
  const { result } = useBooking();
  if (!result) return null;

  return (
    <div className="py-4 text-center">
      <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-pill bg-surface">
        <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden>
          <path
            d="M5 12.5l4.5 4.5L19 7.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <h3 className="font-display text-2xl">Записали вас</h3>
      <p className="mx-auto mt-3 max-w-sm leading-relaxed text-muted">
        {result.serviceTitle} — {formatDateLong(result.date)} в {result.time}. Мастер подтвердит
        запись по телефону в течение 15 минут.
      </p>

      <p className="mt-6 text-sm text-muted">
        Что-то изменилось?{" "}
        <a href={site.contacts.phoneHref} className="text-ink underline underline-offset-4">
          {site.contacts.phone}
        </a>
      </p>
    </div>
  );
}
