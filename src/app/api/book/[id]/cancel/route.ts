import { NextResponse } from "next/server";
import { bookingRepository } from "@/features/booking/booking-repository";
import { sendEmailCancellation } from "@/features/notifications/channels/email";
import { tgCall } from "@/features/notifications/channels/telegram";

const CHAT_ID = process.env.TELEGRAM_CHAT_ID ?? "";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const cancelledBooking = await bookingRepository.cancel(id);

    if (!cancelledBooking) {
      return NextResponse.json(
        { ok: false, error: "Booking not found" },
        { status: 404 },
      );
    }

    // 1. Send cancellation confirmation email to client
    if (cancelledBooking.email) {
      await sendEmailCancellation(
        cancelledBooking.email,
        cancelledBooking.id,
        cancelledBooking.name,
      );
    }

    // 2. Notify Telegram Admin Channel
    if (CHAT_ID) {
      await tgCall("sendMessage", {
        chat_id: CHAT_ID,
        text: `⚠️ <b>Booking #${cancelledBooking.id} cancelled via email link</b>\nName: ${cancelledBooking.name}\nPhone: ${cancelledBooking.phone}`,
        parse_mode: "HTML",
      });
    }

    // 3. Return lightweight HTML confirmation page
    return new NextResponse(
      `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Booking Cancelled</title>
          <style>
            body { font-family: system-ui, sans-serif; display: grid; place-items: center; min-height: 100vh; margin: 0; background: #fafafa; color: #111; }
            .card { background: #fff; border: 1px solid #e4e4e7; border-radius: 12px; padding: 32px; text-align: center; max-width: 400px; }
            h1 { font-size: 20px; margin-bottom: 8px; }
            p { color: #71717a; font-size: 14px; margin-bottom: 24px; }
            a { background: #000; color: #fff; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-size: 14px; font-weight: 500; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>Booking #${id} Cancelled</h1>
            <p>Your appointment has been successfully cancelled. We hope to see you again soon!</p>
            <a href="/">Back to Home</a>
          </div>
        </body>
      </html>
      `,
      { headers: { "Content-Type": "text/html; charset=utf-8" } },
    );
  } catch (err) {
    console.error("[cancel-booking-error]", err);
    return NextResponse.json(
      { ok: false, error: "Failed to cancel booking" },
      { status: 500 },
    );
  }
}
