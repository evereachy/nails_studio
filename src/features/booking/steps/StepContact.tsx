"use client";

import { getService } from "@/config/catalog";
import { uploads } from "@/config/uploads";
import { TextAreaField, TextField } from "@/components/ui/Field";
import { PhotoPicker } from "@/components/ui/PhotoPicker";
import { formatDateLong, formatDuration, formatPrice, maskPhone } from "@/lib/format";
import { useBooking } from "../BookingProvider";


export function StepContact() {
  const { draft, patch, fieldErrors } = useBooking();
  const service = getService(draft.serviceId);

  return (
    <div className="space-y-5">
      {service && draft.date && draft.time && (
        <div className="rounded-control bg-surface px-4 py-4 text-sm">
          <p className="text-ink">{service.title}</p>
          <p className="mt-1 text-muted">
            {formatDateLong(draft.date)}, {draft.time} · {formatDuration(service.durationMin)} ·{" "}
            {formatPrice(service.price, service.currency)}
          </p>
        </div>
      )}

      <TextField
        id="booking-name"
        label="Имя"
        placeholder="Анна"
        autoComplete="given-name"
        enterKeyHint="next"
        value={draft.name}
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
        value={draft.phone}
        error={fieldErrors.phone}
        hint="Позвоним, только чтобы подтвердить время"
        onChange={(e) => patch({ phone: maskPhone(e.target.value) })}
      />

      <TextAreaField
        id="booking-comment"
        label="Комментарий — по желанию"
        placeholder="Например: хочу убрать жёлтый оттенок"
        value={draft.comment}
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
