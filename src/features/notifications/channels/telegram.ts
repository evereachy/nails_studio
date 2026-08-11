import type { BookingRecord } from "@/types";
import { formatDateLong, formatDuration, formatPrice } from "@/lib/utils/format";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN ?? "";
const CHAT_ID = process.env.TELEGRAM_CHAT_ID ?? "";
const THREAD_ID = process.env.TELEGRAM_THREAD_ID ?? "";

const API = "https://api.telegram.org";
const TIMEOUT_MS = 8000;
const MAX_RETRIES = 2;

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function endTime(b: BookingRecord) {
  const [h, m] = b.time.split(":").map(Number);
  const end = h * 60 + m + b.totalDurationMin;
  return `${String(Math.floor(end / 60)).padStart(2, "0")}:${String(end % 60).padStart(2, "0")}`;
}

function serviceLines(b: BookingRecord, bullet = "  • ") {
  return b.lines
    .map(
      (l) =>
        `${bullet}${esc(l.serviceTitle)} — ${esc(l.variantLabel)}, ${formatDuration(l.durationMin)}, ${formatPrice(l.price, b.currency)}`,
    )
    .join("\n");
}

/** Builds admin Telegram notification payload */
export function buildAdminMessage(b: BookingRecord) {
  const lines = [
    "📅 <b>New Booking</b>",
    "",
    `<b>Name:</b> ${esc(b.name)}`,
    `<b>Phone:</b> ${esc(b.phone)}`,
    b.telegram ? `<b>Telegram:</b> ${esc(b.telegram)}` : "",
    "",
    `<b>Procedures (${b.lines.length}):</b>`,
    serviceLines(b),
    "",
    `<b>Total:</b> ${formatDuration(b.totalDurationMin)} · ${formatPrice(b.totalPrice, b.currency)}`,
    `<b>Specialist:</b> ${esc(b.masterName)}`,
    `<b>Date:</b> ${formatDateLong(b.date)}`,
    `<b>Time:</b> ${b.time} — ${endTime(b)}`,
  ].filter(Boolean);

  if (b.comment?.trim()) lines.push(`<b>Comment:</b> ${esc(b.comment.trim())}`);
  if (b.photos?.length) lines.push(`<b>Photos:</b> ${b.photos.length} item(s) — sent in next message`);
  lines.push("", `<i>#${b.id}</i>`);
  return lines.join("\n");
}

/** Builds client Telegram message payload */
export function buildClientMessage(b: BookingRecord) {
  const lines = [
    `✨ <b>Your Booking #${b.id}</b>`,
    "",
    `<b>Date:</b> ${formatDateLong(b.date)}`,
    `<b>Time:</b> ${b.time} — ${endTime(b)}`,
    `<b>Specialist:</b> ${esc(b.masterName)}`,
    "",
    `<b>Procedures:</b>`,
    serviceLines(b),
    "",
    `<b>Total Price:</b> ${formatPrice(b.totalPrice, b.currency)}`,
  ];

  if (b.comment?.trim()) lines.push(`<b>Comment:</b> ${esc(b.comment.trim())}`);
  lines.push("", "You can manage your booking using the buttons below:");
  return lines.join("\n");
}

/** Generates inline action buttons for client Telegram interactions */
export function getClientActionButtons(bookingId: string) {
  return {
    inline_keyboard: [
      [
        { text: "🗓️ Reschedule", callback_data: `reschedule_${bookingId}` },
        { text: "❌ Cancel", callback_data: `cancel_${bookingId}` },
      ],
    ],
  };
}

/** Low-level helper for calling Telegram Bot API endpoints */
export async function tgCall(
  method: string,
  body: FormData | Record<string, unknown>,
  attempt = 0,
) {
  if (!BOT_TOKEN) throw new Error("TELEGRAM_BOT_TOKEN is not defined");

  const isForm = body instanceof FormData;
  let requestBody: BodyInit;

  if (isForm) {
    requestBody = body;
  } else {
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

  if (!res.ok || !data.ok) {
    console.error(`[Telegram API Error] ${method} (${res.status}):`, data);
  }

  if (res.ok && data.ok) return data;

  if ((res.status === 429 || res.status >= 500) && attempt < MAX_RETRIES) {
    const waitSec = data.parameters?.retry_after ?? 2 ** attempt;
    await new Promise((r) => setTimeout(r, waitSec * 1000));
    return tgCall(method, body, attempt + 1);
  }

  throw new Error(`Telegram ${method} ${res.status}: ${data.description ?? "error"}`);
}

function target() {
  return THREAD_ID
    ? { chat_id: CHAT_ID, message_thread_id: Number(THREAD_ID) }
    : { chat_id: CHAT_ID };
}

function dataUrlToBlob(dataUrl: string) {
  const comma = dataUrl.indexOf(",");
  const mime = /^data:([^;]+);/.exec(dataUrl)?.[1] ?? "image/jpeg";
  const bytes = Buffer.from(dataUrl.slice(comma + 1), "base64");
  return new Blob([new Uint8Array(bytes)], { type: mime });
}

async function sendPhotos(booking: BookingRecord) {
  const photos = (booking.photos ?? []).slice(0, 10);
  if (photos.length === 0) return;

  const form = new FormData();
  for (const [k, v] of Object.entries(target())) form.append(k, String(v));

  const caption = `Photos for booking #${booking.id} — ${booking.name}`;
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

/** Sends admin alert and photos to Telegram group */
export async function sendAdminTelegramNotification(booking: BookingRecord) {
  if (!BOT_TOKEN || !CHAT_ID) {
    console.info("[telegram] Missing credentials, skipping admin notification.");
    return false;
  }

  await tgCall("sendMessage", {
    ...target(),
    text: buildAdminMessage(booking),
    parse_mode: "HTML",
    disable_web_page_preview: true,
  });

  try {
    await sendPhotos(booking);
  } catch (e) {
    console.error("[telegram] Photos failed to send:", e);
  }

  return true;
}
