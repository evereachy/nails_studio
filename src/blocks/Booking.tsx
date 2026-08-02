"use client";

import { Section } from "@/components/ui/Section";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { BookingFlow } from "@/features/booking/BookingFlow";
import { useBooking } from "@/features/booking/BookingProvider";

const steps = [
  { n: "1", t: "Выбираете услугу", d: "От неё зависит, сколько времени займёт визит." },
  { n: "2", t: "Смотрите свободные часы", d: "Занятые слоты сразу скрыты — промахнуться нельзя." },
  { n: "3", t: "Оставляете телефон", d: "Мастер подтверждает запись в течение 15 минут." },
];

/**
 * БЛОК 4 — Запись (ядро продукта).
 * Мобиле: краткое объяснение + кнопка, форма открывается шторкой на весь экран.
 * Десктоп: форма прямо в секции, без лишнего клика.
 */
export function Booking() {
  const { open } = useBooking();

  return (
    <Section
      id="booking"
      eyebrow="Запись"
      title="Три шага, минута времени"
      lead="Онлайн-запись работает круглосуточно. Предоплату не берём, отмена бесплатна за 4 часа."
    >
      <div className="grid gap-8 md:grid-cols-2 md:gap-12">
        <ol className="space-y-6">
          {steps.map((s) => (
            <li key={s.n} className="flex gap-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-pill border border-line text-sm tabular-nums">
                {s.n}
              </span>
              <span>
                <span className="block text-[17px]">{s.t}</span>
                <span className="mt-1 block text-sm leading-relaxed text-muted">{s.d}</span>
              </span>
            </li>
          ))}

          <li className="pt-2 md:hidden">
            <Button fullWidth size="lg" onClick={() => open(1)}>
              Выбрать время
            </Button>
          </li>
        </ol>

        {/* Инлайн-форма только с md — на мобиле её роль играет шторка */}
        <Card className="hidden overflow-hidden md:block">
          <BookingFlow className="max-h-[560px] py-5" />
        </Card>
      </div>
    </Section>
  );
}
