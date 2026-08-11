import type { BookingRecord } from "@/types";
import { sendEmailConfirmation, sendEmailCancellation } from "./channels/email";
import { sendAdminTelegramNotification, buildAdminMessage } from "./channels/telegram";

export interface DeliveryResult {
  telegram: boolean;
  email: boolean;
}

/**
 * Primary entry point called when a booking is created.
 * Sends admin alert to Telegram and email confirmation to the client, returning delivery status.
 */
export async function notifyBooking(booking: BookingRecord): Promise<DeliveryResult> {
  const results = await Promise.allSettled([
    sendAdminTelegramNotification(booking),
    booking.email ? sendEmailConfirmation(booking.email, booking) : Promise.resolve(false),
  ]);

  return {
    telegram: results[0].status === "fulfilled" && Boolean(results[0].value),
    email: results[1].status === "fulfilled" && Boolean(results[1].value),
  };
}

/**
 * Legacy/Alternative entry point.
 */
export async function notifyNewBooking(booking: BookingRecord, clientEmail?: string) {
  const targetEmail = clientEmail || booking.email;
  const tasks: Promise<unknown>[] = [
    sendAdminTelegramNotification(booking).catch((err) =>
      console.error("[Notification] Telegram admin alert failed:", err),
    ),
  ];

  if (targetEmail) {
    tasks.push(
      sendEmailConfirmation(targetEmail, booking).catch((err) =>
        console.error("[Notification] Client email failed:", err),
      ),
    );
  }

  await Promise.allSettled(tasks);
}

export { sendEmailConfirmation, sendEmailCancellation, buildAdminMessage };
