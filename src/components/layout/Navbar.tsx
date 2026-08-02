"use client";

import { useEffect, useState } from "react";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { site } from "@/config/site";
import { cn } from "@/lib/cn";
import { useBooking } from "@/features/booking/BookingProvider";

const links = [
  { href: "#services", label: "Услуги" },
  { href: "#booking", label: "Запись" },
  { href: "#reviews", label: "Отзывы" },
  { href: "#faq", label: "Вопросы" },
];

export function Navbar() {
  const { open } = useBooking();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-40 transition-colors duration-300 ease-soft",
        scrolled ? "border-b border-line bg-bg/80 backdrop-blur-xl" : "border-b border-transparent",
      )}
    >
      <Container className="flex h-16 items-center justify-between">
        <a href="#top" className="font-display text-lg tracking-[0.22em]">
          {site.name}
        </a>

        {/* Меню только с md — на мобиле навигацию заменяет нижняя панель */}
        <nav className="hidden items-center gap-7 md:flex">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="text-sm text-muted transition-colors hover:text-ink">
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden md:block">
          <Button onClick={() => open(1)}>Записаться</Button>
        </div>

        <a
          href={site.contacts.phoneHref}
          aria-label="Позвонить"
          className="flex h-11 w-11 items-center justify-center rounded-pill border border-line md:hidden"
        >
          <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" aria-hidden>
            <path
              d="M6.5 3.5h3l1.5 4-2 1.5a12 12 0 006 6l1.5-2 4 1.5v3c0 1-.8 1.8-1.8 1.7C10.8 18.8 5.2 13.2 4.8 5.3 4.7 4.3 5.5 3.5 6.5 3.5z"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
          </svg>
        </a>
      </Container>
    </header>
  );
}
