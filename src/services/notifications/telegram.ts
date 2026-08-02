import type { BookingRecord } from "@/types";
import { formatDateLong, formatDuration, formatPrice } from "@/lib/format";
import type { NotificationChannel } from "./types";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN ?? "";
const CHAT_ID = process.env.TELEGRAM_CHAT_ID ?? "";

/** Экранирование под parse_mode: HTML */
function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function buildMessage(b: BookingRecord) {
  const lines = [
    "📅 <b>Новая запись</b>",
    "",
    `<b>Имя:</b> ${esc(b.name)}`,
    `<b>Телефон:</b> ${esc(b.phone)}`,
    `<b>Услуга:</b> ${esc(b.serviceTitle)} · ${formatDuration(b.durationMin)} · ${formatPrice(b.price, b.currency)}`,
    `<b>Дата:</b> ${formatDateLong(b.date)}`,
    `<b>Время:</b> ${b.time}`,
  ];
  if (b.comment?.trim()) lines.push(`<b>Комментарий:</b> ${esc(b.comment.trim())}`);
  if (b.photos?.length) lines.push(`<b>Фото:</b> ${b.photos.length}`);
  lines.push("", `<i>#${b.id}</i>`);
  return lines.join("\n");
}

/** data:image/jpeg;base64,... -> Blob для multipart-загрузки */
function dataUrlToBlob(dataUrl: string) {
  const comma = dataUrl.indexOf(",");
  const mime = /^data:([^;]+);/.exec(dataUrl)?.[1] ?? "image/jpeg";
  const bytes = Buffer.from(dataUrl.slice(comma + 1), "base64");
  return new Blob([bytes], { type: mime });
}

/**
 * Фото уходят отдельным сообщением через sendMediaGroup —
 * в чате они склеиваются в один альбом под текстом записи.
 * Одно фото альбомом слать нельзя, для него sendPhoto.
 */
async function sendPhotos(booking: BookingRecord) {
  const photos = (booking.photos ?? []).slice(0, 10);
  if (photos.length === 0) return;

  const form = new FormData();
  form.append("chat_id", CHAT_ID);

  const caption = `Фото к записи #${booking.id} — ${booking.name}`;
  const single = photos.length === 1;

  if (single) {
    form.append("photo", dataUrlToBlob(photos[0].dataUrl), photos[0].name);
    form.append("caption", caption);
  } else {
    form.append(
      "media",
      JSON.stringify(
        photos.map((p, i) => ({
          type: "photo",
          media: `attach://file${i}`,
          ...(i === 0 ? { caption } : {}),
        })),
      ),
    );
    photos.forEach((p, i) => form.append(`file${i}`, dataUrlToBlob(p.dataUrl), p.name));
  }

  const method = single ? "sendPhoto" : "sendMediaGroup";
  const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
    method: "POST",
    body: form,
  });

  if (!res.ok) {
    // Текст записи уже ушёл — заявку из-за фото не теряем, только логируем.
    console.error(`[telegram:${method}] ${res.status}`, await res.text());
  }
}
export const telegramChannel: NotificationChannel = {
  id: "telegram",

  isConfigured: () => Boolean(BOT_TOKEN && CHAT_ID),

  async send(booking: BookingRecord) {
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: buildMessage(booking),
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Telegram ${res.status}: ${body}`);
    }
    await sendPhotos(booking);
  },
};
