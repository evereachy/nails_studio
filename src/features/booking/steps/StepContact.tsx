"use client";

import { uploads } from "@/config/uploads";
import { TextAreaField, TextField } from "@/components/ui/Field";
import { PhotoPicker } from "@/components/ui/PhotoPicker";
import { formatDateLong, formatDuration, formatPrice, maskPhone } from "@/lib/format";
import { summarize } from "@/lib/selection";
import { useBooking } from "../BookingProvider";
import { useAvailability } from "../AvailabilityProvider";

export function StepContact() {
  const { draft, patch, fieldErrors } = useBooking();
  const { data } = useAvailability();
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
        label="Имя"
        placeholder="Анна"
        autoComplete="given-name"
        enterKeyHint="next"
        value={draft.name ?? ""}
        error={fieldErrors.name}
        onChange={(e) => patch({ name: e.target.value })}
      />

      <TextField
        id="booking-phone"
        label="Телефон"
        placeholder="+420 777 123 456"
        // inputMode + type=tel — на мобиле открывается цифровая клавиатура
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        enterKeyHint="done"
        value={draft.phone ?? ""}
        error={fieldErrors.phone}
        hint="Позвоним, только чтобы подтвердить время"
        onChange={(e) => patch({ phone: maskPhone(e.target.value) })}
      />

      <TextAreaField
        id="booking-comment"
        label="Комментарий — по желанию"
        placeholder="Например: хочу убрать жёлтый оттенок"
        value={draft.comment ?? ""}
        onChange={(e) => patch({ comment: e.target.value })}
      />

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
