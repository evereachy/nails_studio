import type { BookingRecord } from "@/types";
import { formatDateLong, formatDuration, formatPrice } from "@/lib/format";
import type { NotificationChannel } from "./types";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN ?? "";
const CHAT_ID = process.env.TELEGRAM_CHAT_ID ?? "";
const THREAD_ID = process.env.TELEGRAM_THREAD_ID ?? "";

const API = "https://api.telegram.org";
const TIMEOUT_MS = 8000;
const MAX_RETRIES = 2;

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Сообщение для администратора */
export function buildAdminMessage(b: BookingRecord) {
  const lines = [
    "📅 <b>Новая запись</b>",
    "",
    `<b>Имя:</b> ${esc(b.name)}`,
    `<b>Телефон:</b> ${esc(b.phone)}`,
    b.telegram ? `<b>Telegram:</b> ${esc(b.telegram)}` : "",
    `<b>Услуга:</b> ${esc(b.serviceTitle)} · ${formatDuration(b.durationMin)} · ${formatPrice(b.price, b.currency)}`,
    `<b>Дата:</b> ${formatDateLong(b.date)}`,
    `<b>Время:</b> ${b.time}`,
  ].filter(Boolean);

  if (b.comment?.trim()) lines.push(`<b>Комментарий:</b> ${esc(b.comment.trim())}`);
  if (b.photos?.length) lines.push(`<b>Фото:</b> ${b.photos.length} шт. — следующим сообщением`);
  lines.push("", `<i>#${b.id}</i>`);
  return lines.join("\n");
}

/** Сообщение для клиента */
export function buildClientMessage(b: BookingRecord) {
  return [
    `Здравствуйте, <b>${esc(b.name)}</b>! 👋`,
    "",
    "Ваша запись успешно подтверждена:",
    `• <b>Услуга:</b> ${esc(b.serviceTitle)}`,
    `• <b>Дата:</b> ${formatDateLong(b.date)}`,
    `• <b>Время:</b> ${b.time}`,
    `• <b>Длительность:</b> ${formatDuration(b.durationMin)}`,
    `• <b>Стоимость:</b> ${formatPrice(b.price, b.currency)}`,
    "",
    "Ждём вас!",
  ].join("\n");
}

// export function getClientActionButtons(bookingId: string) {
//   const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://e976-2a00-11b7-1112-c900-7517-76e-bcc-2c7f.ngrok-free.app"
//
//   return {
//     inline_keyboard: [
//       [
//         {
//           text: "✏️ Перенести запись",
//           url: `${appUrl}?reschedule=${bookingId}`,
//         },
//         {
//           text: "❌ Отменить",
//           callback_data: `cancel_${bookingId}`,
//         },
//       ],
//     ],
//   };
// }

export function getClientActionButtons(bookingId: string) {
  return {
    inline_keyboard: [
      [
        {
          text: "✏️ Перенести",
          callback_data: `reschedule_${bookingId}`,
        },
        {
          text: "❌ Отменить",
          callback_data: `cancel_${bookingId}`,
        },
      ],
    ],
  };
}

export async function tgCall(
  method: string,
  body: FormData | Record<string, unknown>,
  attempt = 0,
) {
  if (!BOT_TOKEN) throw new Error("TELEGRAM_BOT_TOKEN не задан");

  const isForm = body instanceof FormData;
  let requestBody: BodyInit;

  if (isForm) {
    requestBody = body;
  } else {
    // Clone body and stringify reply_markup explicitly for Telegram API requirement
    const payload = { ...body };
    if (payload.reply_markup && typeof payload.reply_markup === "object") {
      payload.reply_markup = JSON.stringify(payload.reply_markup);
    }
    requestBody = JSON.stringify(payload);
  }

  const res = await fetch(`${API}/bot${BOT_TOKEN}/${method}`, {
    method: "POST",
    headers: isForm ? undefined : { "Content-Type": "application/json" },
    body: requestBody,
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });

  const data = await res.json().catch(() => ({ ok: false }));

  // Print exact Telegram API error details to console if Telegram rejects a request
  if (!res.ok || !data.ok) {
    console.error(`[Telegram API Error] ${method} (${res.status}):`, data);
  }

  if (res.ok && data.ok) return data;

  if ((res.status === 429 || res.status >= 500) && attempt < MAX_RETRIES) {
    const waitSec = data.parameters?.retry_after ?? 2 ** attempt;
    await new Promise((r) => setTimeout(r, waitSec * 1000));
    return tgCall(method, body, attempt + 1);
  }

  throw new Error(`Telegram ${method} ${res.status}: ${data.description ?? "ошибка"}`);
}

function target() {
  return THREAD_ID
    ? { chat_id: CHAT_ID, message_thread_id: Number(THREAD_ID) }
    : { chat_id: CHAT_ID };
}

export const telegramChannel: NotificationChannel = {
  id: "telegram",

  isConfigured: () => Boolean(BOT_TOKEN && CHAT_ID),

  async send(booking: BookingRecord) {
    // Admin notification remains
    await tgCall("sendMessage", {
      ...target(),
      text: buildAdminMessage(booking),
      parse_mode: "HTML",
      disable_web_page_preview: true,
    });
  },
};

export { buildAdminMessage as buildMessage } from "./telegram";
