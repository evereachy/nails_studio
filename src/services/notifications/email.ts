import { Resend } from "resend";
import { getBookingConfirmationHtml, getBookingCancelledHtml } from "./email-templates";
import type { BookingRecord } from "@/types";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.EMAIL_FROM || "onboarding@resend.dev";

export async function sendEmailConfirmation(to: string, booking: BookingRecord) {
  if (!to) return;

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
  if (!to) return;

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
