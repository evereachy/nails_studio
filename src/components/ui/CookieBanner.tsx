"use client";

import { useState, useEffect } from "react";

const COOKIE_KEY = "cookie_consent";

export function CookieBanner() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Show banner only if user hasn't made a choice yet
    const consent = localStorage.getItem(COOKIE_KEY);
    if (!consent) {
      setShowBanner(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(COOKIE_KEY, "accepted");
    setShowBanner(false);
  };

  const handleDecline = () => {
    localStorage.setItem(COOKIE_KEY, "declined");
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-lg rounded-control bg-surface p-4 border border-muted/20 shadow-xl transition-all sm:bottom-6 sm:right-6 sm:left-auto">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm leading-relaxed text-muted">
          Мы используем cookie для улучшения работы сайта и анализа посещаемости.
        </p>

        <div className="flex items-center justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={handleDecline}
            className="rounded-control px-3.5 py-2 text-xs font-medium text-muted transition hover:bg-surface-hover hover:text-ink"
          >
            Отклонить
          </button>
          <button
            type="button"
            onClick={handleAccept}
            className="rounded-control bg-ink px-4 py-2 text-xs font-medium text-surface transition hover:opacity-90 active:scale-[0.98]"
          >
            Принять
          </button>
        </div>
      </div>
    </div>
  );
}
