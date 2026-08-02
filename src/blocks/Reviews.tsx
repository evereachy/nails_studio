import Image from "next/image";
import { Section } from "@/components/ui/Section";
import { Card } from "@/components/ui/Card";
import { Stars } from "@/components/ui/Stars";
import { reviews } from "@/config/content";

/**
 * БЛОК 5 — Отзывы.
 * Карусель на нативном scroll-snap: никакой библиотеки слайдера,
 * инерция и «резинка» работают ровно так, как ожидает палец на iOS/Android.
 */
export function Reviews() {
  return (
    <Section
      id="reviews"
      eyebrow="Отзывы"
      title="Что говорят гостьи"
      lead="Публикуем как есть, включая замечания."
      className="bg-surface"
    >
      <div className="rail lg:grid lg:grid-cols-2 lg:gap-4 lg:overflow-visible lg:[margin-inline:0] lg:[padding-inline:0]">
        {reviews.map((r) => (
          <Card key={r.id} className="w-[82vw] max-w-sm p-5 lg:w-auto lg:max-w-none">
            <div className="flex items-center gap-3">
              {r.avatar && (
                <Image
                  src={r.avatar}
                  alt=""
                  width={40}
                  height={40}
                  className="h-10 w-10 rounded-pill object-cover"
                />
              )}
              <div className="min-w-0">
                <p className="truncate text-[15px]">{r.name}</p>
                <p className="text-sm text-muted">{r.serviceTitle}</p>
              </div>
              <div className="ml-auto">
                <Stars value={r.rating} />
              </div>
            </div>
            <p className="mt-4 text-[15px] leading-relaxed text-muted">{r.text}</p>
          </Card>
        ))}
      </div>

      <p className="mt-4 text-sm text-muted lg:hidden">Листайте вбок →</p>
    </Section>
  );
}
