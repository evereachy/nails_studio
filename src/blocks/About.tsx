import { Section } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { site } from "@/config/site";

/** БЛОК 2 — О салоне. Короткий текст + три факта. */
export function About() {
  return (
    <Section id="about" eyebrow={site.about.eyebrow} title={site.about.title} lead={site.about.text}>
      <Reveal>
        <dl className="grid grid-cols-3 gap-4 border-t border-line pt-8">
          {site.about.stats.map((s) => (
            <div key={s.label}>
              <dt className="font-display text-2xl md:text-4xl">{s.value}</dt>
              <dd className="mt-1 text-sm leading-snug text-muted">{s.label}</dd>
            </div>
          ))}
        </dl>
      </Reveal>
    </Section>
  );
}
