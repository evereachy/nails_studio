"use client";

import { uploads } from "@/config/uploads";
import { TextAreaField, TextField } from "@/components/ui/Field";
import { PhotoPicker } from "@/components/ui/PhotoPicker";
import { formatDateLong, formatDuration, formatPrice, maskPhone } from "@/lib/utils/format";
import { summarize } from "@/features/booking/selection";
import { useBookingStore } from "../store/useBookingStore";
import { useAvailabilityStore } from "../store/useAvailabilityStore";

export function StepContact() {
  const draft = useBookingStore((s) => s.draft);
  const patch = useBookingStore((s) => s.patch);
  const fieldErrors = useBookingStore((s) => s.fieldErrors);

  const data = useAvailabilityStore((s) => s.data);

  const summary = summarize(draft.items);
  const master = data?.masters.find((m) => m.id === draft.masterId) ?? null;

  return (
    <div className="space-y-5">
      {summary.items.length > 0 && draft.date && draft.time && (
        <div className="rounded-control bg-surface px-4 py-4 text-sm">
          <ul className="space-y-1">
            {summary.items.map(({ service, variant }) => (
              <li key={service.id} className="flex justify-between gap-3">
                <span className="min-w-0 truncate">
                  {service.title} — <span className="text-muted">{variant.label}</span>
                </span>
                <span className="shrink-0 tabular-nums text-muted">
                  {formatPrice(variant.price, service.currency)}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-3 border-t border-line pt-3 text-muted">
            {formatDateLong(draft.date)}, {draft.time} · {formatDuration(summary.durationMin)} ·{" "}
            <span className="text-ink">{formatPrice(summary.price, summary.currency)}</span>
          </p>
          <p className="mt-1 text-muted">
            Мастер: <span className="text-ink">{master ? master.name : "любой свободный"}</span>
          </p>
        </div>
      )}

      <TextField
        id="booking-name"
        label="Имя *"
        placeholder="Анна"
        autoComplete="given-name"
        enterKeyHint="next"
        value={draft.name ?? ""}
        error={fieldErrors.name}
        onChange={(e) => patch({ name: e.target.value })}
      />

      <TextField
        id="booking-phone"
        label="Телефон *"
        placeholder="+420 777 123 456"
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        enterKeyHint="next"
        value={draft.phone ?? ""}
        error={fieldErrors.phone}
        hint="Для связи при подтверждении визита"
        onChange={(e) => patch({ phone: maskPhone(e.target.value) })}
      />

      <TextField
        id="booking-email"
        label="Email *"
        placeholder="anna@example.com"
        type="email"
        inputMode="email"
        autoComplete="email"
        enterKeyHint="done"
        value={draft.email ?? ""}
        error={fieldErrors.email}
        hint="Отправим подтверждение и ссылку для переноса"
        onChange={(e) => patch({ email: e.target.value })}
      />

      <TextAreaField
        id="booking-comment"
        label="Комментарий — по желанию"
        placeholder="Например: хочу убрать жёлтый оттенок"
        value={draft.comment ?? ""}
        onChange={(e) => patch({ comment: e.target.value })}
      />

      {/* 🟢 Privacy / Consent Checkbox */}
      <div className="space-y-1">
        <label className="flex items-start gap-3 cursor-pointer text-sm select-none">
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4 rounded border-line text-ink focus:ring-ink shrink-0 cursor-pointer"
            checked={Boolean(draft.agreedToTerms)}
            onChange={(e) => patch({ agreedToTerms: e.target.checked })}
          />
          <span className="text-muted leading-tight">
            Я соглашаюсь на{" "}
            <a
              href="/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-ink underline underline-offset-2 hover:opacity-80"
              onClick={(e) => e.stopPropagation()}
            >
              обработку персональных данных
            </a>{" "}
            для записи на визит *
          </span>
        </label>
        {fieldErrors.agreedToTerms && (
          <p className="text-xs text-red-500 pl-7">{fieldErrors.agreedToTerms}</p>
        )}
      </div>

      <PhotoPicker
        label="Фото — по желанию"
        hint={`Референс или ваш нынешний цвет. До ${uploads.maxFiles} фото, мастер посмотрит заранее`}
        value={draft.photos}
        error={fieldErrors.photos}
        onChange={(photos) => patch({ photos })}
      />
    </div>
  );
}
