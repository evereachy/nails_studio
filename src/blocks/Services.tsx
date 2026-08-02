"use client";

import Image from "next/image";
import { Section } from "@/components/ui/Section";
import { Card } from "@/components/ui/Card";
import { services } from "@/config/catalog";
import { formatDuration, formatPrice } from "@/lib/format";
import { useBooking } from "@/features/booking/BookingProvider";

/**
 * БЛОК 3 — Услуги.
 * Мобильная сетка в 1 колонку вместо ленты: цены сравнивают вертикально,
 * а горизонтальный скролл прячет половину каталога.
 */
export function Services() {
  const { patch, open } = useBooking();

  return (
    <Section
      id="services"
      eyebrow="Услуги"
      title="Прайс без звёздочек"
      lead="Цена указана за среднюю длину волос. Если нужен больший объём состава, мастер назовёт итог до начала работы."
      className="bg-surface"
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((s) => (
          <Card key={s.id} className="overflow-hidden hover:shadow-lift">
            <button
              onClick={() => {
                patch({ serviceId: s.id, time: null });
                open(2);
              }}
              className="flex w-full items-center gap-4 p-3 text-left sm:block sm:p-0"
            >
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-[16px] sm:h-auto sm:w-full sm:rounded-none sm:aspect-[4/3]">
                <Image
                  src={s.image}
                  alt={s.title}
                  fill
                  sizes="(max-width: 640px) 96px, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover transition-transform duration-500 ease-soft hover:scale-[1.03]"
                />
              </div>

              <div className="min-w-0 flex-1 sm:p-5">
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="truncate text-[17px]">{s.title}</h3>
                  <span className="shrink-0 tabular-nums">{formatPrice(s.price, s.currency)}</span>
                </div>
                <p className="mt-1 text-sm text-muted">{formatDuration(s.durationMin)}</p>
                <p className="mt-2 hidden text-sm leading-relaxed text-muted sm:block">
                  {s.description}
                </p>
              </div>
            </button>
          </Card>
        ))}
      </div>
    </Section>
  );
}
