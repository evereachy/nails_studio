import { Container } from "@/components/ui/Container";
import { site } from "@/config/site";

const socials = [
  { label: "Instagram", href: site.contacts.instagram },
  { label: "Telegram", href: site.contacts.telegram },
  { label: "WhatsApp", href: site.contacts.whatsapp },
];

/** БЛОК 8 — Подвал: контакты, часы, соцсети. */
export function Footer() {
  return (
    <footer className="border-t border-line pb-28 pt-14 md:pb-14">
      <Container>
        <div className="grid gap-10 md:grid-cols-3">
          <div>
            <p className="font-display text-lg tracking-[0.22em]">{site.name}</p>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              {site.tagline}, {site.city}
            </p>
            <div className="mt-4 flex gap-4">
              {socials.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-muted underline-offset-4 transition-colors hover:text-ink hover:underline"
                >
                  {s.label}
                </a>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-3 text-xs uppercase tracking-[0.18em] text-muted">Контакты</p>
            <a href={site.contacts.phoneHref} className="block text-[15px]">
              {site.contacts.phone}
            </a>
            <a href={`mailto:${site.contacts.email}`} className="mt-1 block text-[15px] text-muted">
              {site.contacts.email}
            </a>
            <a
              href={site.contacts.mapUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-3 block text-[15px] leading-relaxed text-muted underline-offset-4 hover:underline"
            >
              {site.contacts.address}
            </a>
          </div>

          <div>
            <p className="mb-3 text-xs uppercase tracking-[0.18em] text-muted">Часы работы</p>
            <dl className="space-y-1.5 text-[15px]">
              {site.hours.map((h) => (
                <div key={h.days} className="flex justify-between gap-6 md:justify-start md:gap-4">
                  <dt className="text-muted">{h.days}</dt>
                  <dd className="tabular-nums">{h.time}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        <p className="mt-12 border-t border-line pt-6 text-xs text-muted">
          © {new Date().getFullYear()} {site.name}
        </p>
      </Container>
    </footer>
  );
}
