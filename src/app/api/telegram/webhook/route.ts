import { NextResponse } from "next/server";
import { bookingRepository } from "@/features/booking/booking-repository";
import { buildClientMessage, getClientActionButtons, tgCall } from "@/features/notifications/channels/telegram";
import { sendEmailCancellation } from "@/features/notifications/channels/email";

export const runtime = "nodejs";

const ADMIN_CHAT_ID = process.env.TELEGRAM_CHAT_ID ?? "";

export async function POST(req: Request) {
  try {
    const update = await req.json();

    // 1. Handle `/start booking_ID` deeplink from clients
    if (update.message?.text?.startsWith("/start")) {
      const chatId = update.message.chat.id;
      const fullText = update.message.text.trim();
      const payload = fullText.split(" ")[1] ?? "";
      const cleanBookingId = payload.replace(/^booking_/, "");

      const booking = await bookingRepository.getById(cleanBookingId);

      if (booking && booking.status !== "cancelled") {
        await tgCall("sendMessage", {
          chat_id: chatId,
          text: buildClientMessage(booking),
          parse_mode: "HTML",
          reply_markup: getClientActionButtons(booking.id),
        });
      } else {
        await tgCall("sendMessage", {
          chat_id: chatId,
          text: `Unfortunately, booking ${cleanBookingId ? `(#${cleanBookingId}) ` : ""}was not found or has been cancelled.`,
        });
      }
    }

    // 2. Handle Inline Keyboard Callbacks
    if (update.callback_query) {
      const callback = update.callback_query;
      const data: string = callback.data ?? "";
      const messageId = callback.message.message_id;
      const chatId = callback.message.chat.id;

      // Client clicked "Cancel Booking"
      if (data.startsWith("cancel_")) {
        const bookingId = data.replace("cancel_", "");
        const cancelledBooking = await bookingRepository.cancel(bookingId);

        await tgCall("answerCallbackQuery", {
          callback_query_id: callback.id,
          text: "Booking cancelled",
        });

        if (cancelledBooking) {
          await tgCall("editMessageText", {
            chat_id: chatId,
            message_id: messageId,
            text: `🚫 <b>Booking #${bookingId} has been cancelled.</b>\n\nIf you would like to book again in the future, we would be happy to welcome you!`,
            parse_mode: "HTML",
          });

          // Alert admin Telegram channel
          if (ADMIN_CHAT_ID) {
            await tgCall("sendMessage", {
              chat_id: ADMIN_CHAT_ID,
              text: `⚠️ <b>Booking #${bookingId} cancelled by client</b>\nName: ${cancelledBooking.name}\nPhone: ${cancelledBooking.phone}`,
              parse_mode: "HTML",
            });
          }

          // Send Cancellation Confirmation Email
          if (cancelledBooking.email) {
            await sendEmailCancellation(
              cancelledBooking.email,
              bookingId,
              cancelledBooking.name,
            );
          }
        }
      }

      // Client clicked "Reschedule Booking"
      if (data.startsWith("reschedule_")) {
        const bookingId = data.replace("reschedule_", "");
        const appUrl =
          process.env.NEXT_PUBLIC_APP_URL ||
          process.env.APP_URL ||
          "http://localhost:3000";

        await tgCall("answerCallbackQuery", {
          callback_query_id: callback.id,
        });

        await tgCall("sendMessage", {
          chat_id: chatId,
          text: `To choose a new date and time for booking <b>#${bookingId}</b>, please visit our site:\n\n${appUrl}?reschedule=${bookingId}`,
          parse_mode: "HTML",
        });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[telegram-webhook-error]", err);
    // Always return 200 OK so Telegram doesn't endlessly retry failed webhook payloads
    return NextResponse.json({ ok: true });
  }
}
