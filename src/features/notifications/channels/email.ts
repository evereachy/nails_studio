import { Resend } from "resend";
import { getBookingConfirmationHtml, getBookingCancelledHtml } from "../templates/email-templates";
import type { BookingRecord } from "@/types";

const apiKey = process.env.RESEND_API_KEY;
const resend = apiKey ? new Resend(apiKey) : null;
const FROM_EMAIL = process.env.EMAIL_FROM || "onboarding@resend.dev";

export async function sendEmailConfirmation(to: string, booking: BookingRecord) {
  if (!to || !resend) {
    if (!resend) console.info("[sendEmailConfirmation] RESEND_API_KEY not set, skipping email.");
    return;
  }

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `Запись #${booking.id} подтверждена | ATELIER`,
      html: getBookingConfirmationHtml(booking),
    });
  } catch (error) {
    console.error("[sendEmailConfirmation Error]:", error);
  }
}

export async function sendEmailCancellation(to: string, bookingId: string, name: string) {
  if (!to || !resend) {
    if (!resend) console.info("[sendEmailCancellation] RESEND_API_KEY not set, skipping email.");
    return;
  }

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `Запись #${bookingId} отменена | ATELIER`,
      html: getBookingCancelledHtml(bookingId, name),
    });
  } catch (error) {
    console.error("[sendEmailCancellation Error]:", error);
  }
}
