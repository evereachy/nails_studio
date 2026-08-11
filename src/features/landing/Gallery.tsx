import Image from "next/image";
import { Section } from "@/components/ui/Section";
import { gallery } from "@/mock/content";
import { cn } from "@/lib/utils/cn";

/**
 * Gallery Section — Masonry grid showcasing studio work.
 */
export function Gallery() {
  return (
    <Section id="gallery" eyebrow="Работы" title="Из зала">
      <div className="grid grid-cols-2 gap-2 md:grid-cols-3 md:gap-3">
        {gallery.map((g, i) => (
          <div
            key={g.id}
            className={cn(
              "relative overflow-hidden rounded-card",
              i === 0 ? "col-span-2 aspect-[16/10] md:col-span-2" : "aspect-square"
            )}
          >
            <Image
              src={g.src}
              alt={g.alt}
              fill
              loading="lazy"
              sizes="(max-width: 768px) 50vw, 33vw"
              className="object-cover transition-transform duration-700 ease-soft hover:scale-105"
            />
          </div>
        ))}
      </div>
    </Section>
  );
}
