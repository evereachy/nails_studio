"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/cn";

interface Props {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

/**
 * Мобильный bottom-sheet, на десктопе — центрированное модальное окно.
 * Ключевые мобильные детали:
 *  - свайп вниз закрывает
 *  - overscroll-contain, чтобы не скроллилась страница под шторкой
 *  - safe-area снизу под жестовую полосу iPhone
 *  - max-height 90dvh (не vh — иначе адресная строка Safari обрезает низ)
 */
export function Sheet({ open, onClose, title, children }: Props) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          <motion.button
            aria-label="Закрыть"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="absolute inset-0 bg-black/35 backdrop-blur-[2px]"
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ y: "100%", opacity: 0.6 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0.6 }}
            transition={{ type: "spring", damping: 32, stiffness: 320 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.4 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 120 || info.velocity.y > 700) onClose();
            }}
            className={cn(
              "relative flex max-h-[90dvh] w-full flex-col bg-bg",
              "rounded-t-[28px] sm:max-w-lg sm:rounded-card",
              "shadow-lift",
            )}
          >
            {/* «ручка» — подсказка, что шторку можно смахнуть */}
            <div className="flex shrink-0 justify-center pb-1 pt-3 sm:hidden">
              <span className="h-1 w-10 rounded-pill bg-line" />
            </div>

            {title && (
              <div className="flex shrink-0 items-center justify-between px-5 pb-3 pt-2 sm:pt-5">
                <h3 className="font-display text-lg">{title}</h3>
                <button
                  onClick={onClose}
                  aria-label="Закрыть"
                  className="-mr-2 flex h-10 w-10 items-center justify-center rounded-pill text-muted transition-colors hover:bg-surface"
                >
                  <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden>
                    <path
                      d="M5 5l10 10M15 5L5 15"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              </div>
            )}

            <div className="hide-scrollbar flex-1 overflow-y-auto overscroll-contain">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
