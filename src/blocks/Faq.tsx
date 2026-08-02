import { Section } from "@/components/ui/Section";
import { Accordion } from "@/components/ui/Accordion";
import { faq } from "@/config/content";

/** БЛОК 7 — Частые вопросы. */
export function Faq() {
  return (
    <Section id="faq" eyebrow="Вопросы" title="Коротко о важном" className="bg-surface">
      <div className="max-w-2xl">
        <Accordion items={faq} />
      </div>
    </Section>
  );
}
