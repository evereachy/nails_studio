"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { site } from "@/config/site";
import { formatPrice } from "@/lib/utils/format";
import { useBookingStore } from "@/features/booking/store/useBookingStore";
import { services } from "@/mock/catalog";
import { defaultVariant, minPrice } from "@/lib/catalog";

export function Hero() {
  const open = useBookingStore((s) => s.open);
  const toggle = useBookingStore((s) => s.toggle);
  const quick = services.slice(0, 3);

  const start = (serviceId: string) => {
    const service = services.find((s) => s.id === serviceId);
    if (!service) return;
    toggle({ serviceId, variantId: defaultVariant(service).id });
    open(1);
  };

  return (
    <section id="top" className="relative isolate min-h-[100dvh] overflow-hidden md:min-h-0 md:pt-16">
      {/* Background image for mobile layout */}
      <div className="absolute inset-0 -z-10 md:hidden">
        <Image
          src={site.hero.image}
          alt={site.hero.imageAlt}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/85 to-bg/25" />
      </div>

      <Container className="flex min-h-[100dvh] flex-col justify-end pb-4 pt-24 md:min-h-0 md:justify-center md:pb-0">
        <div className="relative z-10 md:grid md:grid-cols-2 md:items-center md:gap-16 md:py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="mb-4 text-xs uppercase tracking-[0.2em] text-muted">
              {site.tagline} · {site.city}
            </p>
            <h1 className="whitespace-pre-line font-display text-[clamp(2.25rem,10vw,4rem)] leading-[1.05] tracking-tight">
              {site.hero.title}
            </h1>
            <p className="mt-5 max-w-md text-[15px] leading-relaxed text-muted md:text-lg">
              {site.hero.subtitle}
            </p>
          </motion.div>

          {/* Quick start booking card */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
            className="mt-7 md:mt-0"
          >
            <div className="rounded-card border border-line bg-elevated/85 p-4 shadow-lift backdrop-blur-xl md:p-6">
              <p className="mb-3 text-sm text-muted">
                Выберите процедуры — покажем свободное время
              </p>

              <div className="space-y-2">
                {quick.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => start(s.id)}
                    className="flex w-full items-center justify-between gap-3 rounded-control border border-line px-4 py-3.5 text-left transition-colors duration-200 ease-soft hover:border-ink/30 active:bg-surface"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-[15px]">{s.title}</span>
                      <span className="text-sm text-muted">
                        {s.variants.length} варианта по времени
                      </span>
                    </span>
                    <span className="shrink-0 text-[15px] tabular-nums text-muted">
                      от {formatPrice(minPrice(s), s.currency)}
                    </span>
                  </button>
                ))}
              </div>

              <Button fullWidth size="lg" className="mt-3" onClick={() => open(1)}>
                {site.hero.cta}
              </Button>

              <p className="mt-3 text-center text-xs text-muted">
                Без предоплаты · подтверждаем за 15 минут
              </p>
            </div>
          </motion.div>
        </div>
      </Container>

      {/* Desktop side image */}
      <div className="pointer-events-none absolute inset-y-0 right-0 z-0 hidden w-1/2 md:block">
        <div className="absolute inset-6 overflow-hidden rounded-card">
          <Image
            src={site.hero.image}
            alt={site.hero.imageAlt}
            fill
            priority
            sizes="50vw"
            className="object-cover"
          />
        </div>
      </div>
    </section>
  );
}
