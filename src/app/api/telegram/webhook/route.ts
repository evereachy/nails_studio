import { bookingRepository } from "@/services/booking-repository";
import { buildClientMessage, getClientActionButtons, tgCall } from "@/services/notifications/telegram";
import { NextResponse } from "next/server";

const CHAT_ID = process.env.TELEGRAM_CHAT_ID ?? "";

export async function POST(req: Request) {
  try {
    const update = await req.json();

    // -------------------------------------------------------------
    // 1. Handle `/start booking_ID` (User tapped Start from Web)
    // -------------------------------------------------------------
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
          text: `К сожалению, запись ${cleanBookingId ? `(#${cleanBookingId}) ` : ""}не найдена или была отменена.`,
        });
      }
    }

    // -------------------------------------------------------------
    // 2. Handle Button Clicks
    // -------------------------------------------------------------
    if (update.callback_query) {
      const callback = update.callback_query;
      const data: string = callback.data ?? "";
      const messageId = callback.message.message_id;
      const chatId = callback.message.chat.id;

      // User clicked "Cancel"
      if (data.startsWith("cancel_")) {
        const bookingId = data.replace("cancel_", "");
        const cancelledBooking = await bookingRepository.cancel(bookingId);

        await tgCall("answerCallbackQuery", {
          callback_query_id: callback.id,
          text: "Запись отменена",
        });

        if (cancelledBooking) {
          await tgCall("editMessageText", {
            chat_id: chatId,
            message_id: messageId,
            text: `🚫 <b>Запись #${bookingId} отменена.</b>\n\nЕсли захотите записаться снова — будем рады видеть вас!`,
            parse_mode: "HTML",
          });

          if (CHAT_ID) {
            await tgCall("sendMessage", {
              chat_id: CHAT_ID,
              text: `⚠️ <b>Запись #${bookingId} отменена клиентом</b>\nИмя: ${cancelledBooking.name}\nТел: ${cancelledBooking.phone}`,
              parse_mode: "HTML",
            });
          }
        }
      }

      // User clicked "Reschedule"
      if (data.startsWith("reschedule_")) {
        const bookingId = data.replace("reschedule_", "");
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://yourdomain.com";

        await tgCall("answerCallbackQuery", {
          callback_query_id: callback.id,
        });

        await tgCall("sendMessage", {
          chat_id: chatId,
          text: `Чтобы выбрать новую дату и время для записи <b>#${bookingId}</b>, перейдите на сайт:\n\n${appUrl}?reschedule=${bookingId}`,
          parse_mode: "HTML",
        });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[telegram-webhook-error]", err);
    return NextResponse.json({ ok: true });
  }
}
