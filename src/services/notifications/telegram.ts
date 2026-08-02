import type { BookingRecord } from "@/types";
import { formatDateLong, formatDuration, formatPrice } from "@/lib/format";
import type { NotificationChannel } from "./types";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN ?? "";
const CHAT_ID = process.env.TELEGRAM_CHAT_ID ?? "";
/** Для супергрупп с темами: id топика, куда падают заявки. Пусто — общий чат. */
const THREAD_ID = process.env.TELEGRAM_THREAD_ID ?? "";

const API = "https://api.telegram.org";
const TIMEOUT_MS = 8000;
const MAX_RETRIES = 2;

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
  if (b.photos?.length) lines.push(`<b>Фото:</b> ${b.photos.length} шт. — следующим сообщением`);
  lines.push("", `<i>#${b.id}</i>`);
  return lines.join("\n");
}

interface TgResponse {
  ok: boolean;
  description?: string;
  parameters?: { retry_after?: number };
  result?: unknown;
}

/**
 * Единая точка вызова Telegram.
 *
 * Что закрывает:
 *  - таймаут: без него зависший запрос держит соединение клиента,
 *    и человек смотрит на крутилку вместо «Записали вас»;
 *  - 429: Telegram лимитирует ~20 сообщений в минуту на группу,
 *    в пиковый вечер это реально поймать — ждём retry_after и повторяем;
 *  - 5xx: сеть Telegram иногда моргает, две попытки решают почти всё;
 *  - 4xx кроме 429 повторять бессмысленно — это наша ошибка в данных.
 */
export async function tgCall(
  method: string,
  body: FormData | Record<string, unknown>,
  attempt = 0,
): Promise<TgResponse> {
  if (!BOT_TOKEN) throw new Error("TELEGRAM_BOT_TOKEN не задан");

  const isForm = body instanceof FormData;
  const res = await fetch(`${API}/bot${BOT_TOKEN}/${method}`, {
    method: "POST",
    headers: isForm ? undefined : { "Content-Type": "application/json" },
    body: isForm ? body : JSON.stringify(body),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });

  const data = (await res.json().catch(() => ({ ok: false }))) as TgResponse;
  if (res.ok && data.ok) return data;

  const retriable = res.status === 429 || res.status >= 500;
  if (retriable && attempt < MAX_RETRIES) {
    const waitSec = data.parameters?.retry_after ?? 2 ** attempt;
    await new Promise((r) => setTimeout(r, waitSec * 1000));
    return tgCall(method, body, attempt + 1);
  }

  throw new Error(`Telegram ${method} ${res.status}: ${data.description ?? "неизвестная ошибка"}`);
}

/** Общие поля адресации — чтобы не дублировать chat_id/thread в каждом вызове. */
function target() {
  return THREAD_ID
    ? { chat_id: CHAT_ID, message_thread_id: Number(THREAD_ID) }
    : { chat_id: CHAT_ID };
}

/** data:image/jpeg;base64,... -> Blob для multipart-загрузки */
function dataUrlToBlob(dataUrl: string) {
  const comma = dataUrl.indexOf(",");
  const mime = /^data:([^;]+);/.exec(dataUrl)?.[1] ?? "image/jpeg";
  const bytes = Buffer.from(dataUrl.slice(comma + 1), "base64");
  return new Blob([bytes], { type: mime });
}

/**
 * Фото уходят отдельным сообщением: в чате они склеиваются в альбом.
 * Одно фото альбомом слать нельзя — для него sendPhoto.
 */
async function sendPhotos(booking: BookingRecord) {
  const photos = (booking.photos ?? []).slice(0, 10);
  if (photos.length === 0) return;

  const form = new FormData();
  for (const [k, v] of Object.entries(target())) form.append(k, String(v));

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

  await tgCall(single ? "sendPhoto" : "sendMediaGroup", form);
}

export const telegramChannel: NotificationChannel = {
  id: "telegram",

  isConfigured: () => Boolean(BOT_TOKEN && CHAT_ID),

  async send(booking: BookingRecord) {
    // Текст — критичен: если он не ушёл, запись считается недоставленной.
    await tgCall("sendMessage", {
      ...target(),
      text: buildMessage(booking),
      parse_mode: "HTML",
      disable_web_page_preview: true,
    });

    // Фото — приятное дополнение. Их падение не должно ломать заявку:
    // мастер уже знает имя, телефон и время, остальное уточнит по звонку.
    try {
      await sendPhotos(booking);
    } catch (e) {
      console.error("[telegram] фото не доставлены", e);
    }
  },
};
