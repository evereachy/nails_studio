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
  lines.push("", `<i>#${b.id}</i>`);
  return lines.join("\n");
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
  },
};
