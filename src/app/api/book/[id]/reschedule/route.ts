import { bookingRepository } from "@/services/booking-repository";
import { tgCall } from "@/services/notifications/telegram";
import { sendEmailConfirmation } from "@/services/notifications/email"; // 🟢 ADDED
import { NextResponse } from "next/server";

const CHAT_ID = process.env.TELEGRAM_CHAT_ID ?? "";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { date, time } = await req.json();

    if (!date || !time) {
      return NextResponse.json(
        { ok: false, error: "Укажите новую дату и время" },
        { status: 400 }
      );
    }

    // 1. Update in repository/DB
    const updated = await bookingRepository.reschedule(params.id, date, time);

    if (!updated) {
      return NextResponse.json(
        { ok: false, error: "Запись не найдена" },
        { status: 404 }
      );
    }

    // 2. Notify Admin Telegram channel
    if (CHAT_ID) {
      await tgCall("sendMessage", {
        chat_id: CHAT_ID,
        text: `🔄 <b>Перенос записи #${updated.id}</b>\n\nClient: ${updated.name}\nNew Date: ${updated.date}\nNew Time: ${updated.time}`,
        parse_mode: "HTML",
      });
    }

    // 3. 🟢 Send updated confirmation email to client
    if (updated.email) {
      await sendEmailConfirmation(updated.email, updated);
    }

    return NextResponse.json({ ok: true, data: updated });
  } catch (err) {
    console.error("[reschedule-error]", err);
    return NextResponse.json(
      { ok: false, error: "Не удалось перенести запись" },
      { status: 500 }
    );
  }
}
