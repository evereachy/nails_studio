"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { site } from "@/config/site";
import { useBooking } from "@/features/booking/BookingProvider";

/**
 * Нижняя панель — главный мобильный элемент.
 * Появляется после первого экрана и прячется, когда открыта шторка записи,
 * чтобы не дублировать кнопку.
 */
export function StickyBookBar() {
  const { open, isOpen } = useBooking();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > window.innerHeight * 0.6);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <AnimatePresence>
      {visible && !isOpen && (
        <motion.div
          initial={{ y: 90 }}
          animate={{ y: 0 }}
          exit={{ y: 90 }}
          transition={{ type: "spring", damping: 28, stiffness: 300 }}
          className="safe-b fixed inset-x-0 bottom-0 z-30 border-t border-line bg-bg/90 px-[var(--pad-x)] pt-3 backdrop-blur-xl md:hidden"
        >
          <div className="flex items-center gap-2">
            <a
              href={site.contacts.phoneHref}
              aria-label="Позвонить в салон"
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-control border border-line"
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
            <Button fullWidth size="lg" onClick={() => open(1)}>
              Записаться
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
