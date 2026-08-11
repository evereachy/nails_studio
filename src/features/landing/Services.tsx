"use client";

import Image from "next/image";
import { Section } from "@/components/ui/Section";
import { Card } from "@/components/ui/Card";
import { formatDuration, formatPrice } from "@/lib/utils/format";
import { useBookingStore } from "@/features/booking/store/useBookingStore";
import { services } from "@/mock/catalog";
import { defaultVariant, minPrice } from "@/lib/catalog";

/**
 * Services Section — Catalog grid with quick-select triggers for booking.
 */
export function Services() {
  const toggle = useBookingStore((s) => s.toggle);
  const open = useBookingStore((s) => s.open);

  const handleSelectService = (serviceId: string) => {
    const service = services.find((s) => s.id === serviceId);
    if (!service) return;

    toggle({ serviceId, variantId: defaultVariant(service).id });
    open(1);
  };

  return (
    <Section
      id="services"
      eyebrow="Услуги"
      title="Прайс без звёздочек"
      lead="У каждой процедуры несколько вариантов по времени — от короткого до полного. Точная длительность выбирается при записи, чтобы мастер заложил нужное окно."
      className="bg-surface"
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((s) => {
          const minDuration = Math.min(...s.variants.map((v) => v.durationMin));
          const maxDuration = Math.max(...s.variants.map((v) => v.durationMin));

          return (
            <Card key={s.id} className="overflow-hidden hover:shadow-lift">
              <button
                onClick={() => handleSelectService(s.id)}
                className="flex w-full items-center gap-4 p-3 text-left sm:block sm:p-0"
              >
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-[16px] sm:aspect-[4/3] sm:h-auto sm:w-full sm:rounded-none">
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
                    <span className="shrink-0 tabular-nums">
                      от {formatPrice(minPrice(s), s.currency)}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted">
                    {formatDuration(minDuration)} — {formatDuration(maxDuration)}
                  </p>
                  <p className="mt-2 hidden text-sm leading-relaxed text-muted sm:block">
                    {s.description}
                  </p>
                </div>
              </button>
            </Card>
          );
        })}
      </div>
    </Section>
  );
}
