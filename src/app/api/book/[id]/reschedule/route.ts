import { NextResponse } from "next/server";
import { bookingRepository } from "@/features/booking/booking-repository";
import { tgCall } from "@/features/notifications/channels/telegram";
import { sendEmailConfirmation } from "@/features/notifications/channels/email";

const CHAT_ID = process.env.TELEGRAM_CHAT_ID ?? "";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { date, time } = await req.json();

    if (!date || !time) {
      return NextResponse.json(
        { ok: false, error: "Please provide both a new date and time" },
        { status: 400 },
      );
    }

    // 1. Update in repository/DB
    const updated = await bookingRepository.reschedule(id, date, time);

    if (!updated) {
      return NextResponse.json(
        { ok: false, error: "Booking not found" },
        { status: 404 },
      );
    }

    // 2. Notify Admin Telegram channel
    if (CHAT_ID) {
      await tgCall("sendMessage", {
        chat_id: CHAT_ID,
        text: `🔄 <b>Booking Rescheduled #${updated.id}</b>\n\nClient: ${updated.name}\nNew Date: ${updated.date}\nNew Time: ${updated.time}`,
        parse_mode: "HTML",
      });
    }

    // 3. Send updated confirmation email to client
    if (updated.email) {
      await sendEmailConfirmation(updated.email, updated);
    }

    return NextResponse.json({ ok: true, data: updated });
  } catch (err) {
    console.error("[reschedule-error]", err);
    return NextResponse.json(
      { ok: false, error: "Failed to reschedule booking" },
      { status: 500 },
    );
  }
}
