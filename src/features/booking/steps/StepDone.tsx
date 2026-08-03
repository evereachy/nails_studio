"use client";

import { site } from "@/config/site";
import { formatDateLong } from "@/lib/format";
import { useBooking } from "../BookingProvider";

const BOT_NAME = process.env.NEXT_PUBLIC_TELEGRAM_BOT_NAME; // e.g., "my_salon_bot"

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

      {/* Кнопка отправки записи в Telegram клиента */}
      {BOT_NAME && (
        <div className="mt-6">
          <a
            href={`https://t.me/${BOT_NAME}?start=booking_${result.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-control bg-[#24A1DE] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#2092ca]"
          >
            <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
              <path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm5.568 8.16c-.18 1.897-.96 6.502-1.356 8.627-.168.9-.504 1.201-.816 1.23-.696.06-1.224-.46-1.896-.9-1.056-.696-1.656-1.128-2.676-1.8-1.188-.78-.42-1.212.264-1.92.18-.18 3.252-2.976 3.312-3.228.008-.036.012-.168-.06-.24-.072-.072-.18-.048-.264-.024-.108.024-1.836 1.176-5.184 3.444-.492.336-.936.504-1.332.492-.444-.012-1.296-.252-1.932-.456-.78-.252-1.404-.384-1.344-.816.036-.228.348-.456.936-.696 3.672-1.6 6.12-2.652 7.344-3.156 3.492-1.452 4.224-1.704 4.692-1.716.108 0 .348.024.504.156.132.108.168.252.18.36.012.084.024.276 0 .432z" />
            </svg>
            Получить детали в Telegram
          </a>
        </div>
      )}

      <p className="mt-6 text-sm text-muted">
        Что-то изменилось?{" "}
        <a href={site.contacts.phoneHref} className="text-ink underline underline-offset-4">
          {site.contacts.phone}
        </a>
      </p>
    </div>
  );
}
