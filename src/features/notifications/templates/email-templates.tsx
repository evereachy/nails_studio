import type { BookingRecord } from "@/types";

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.APP_URL ||
  "https://4e79-2a00-102a-403f-ec0f-60db-adff-cd5b-6a02.ngrok-free.app";

export function getBookingConfirmationHtml(booking: BookingRecord): string {
  const rescheduleUrl = `${APP_URL}?reschedule=${booking.id}`;
  const cancelUrl = `${APP_URL}/api/book/${booking.id}/cancel`;

  return `
    <div style="font-family: sans-serif; color: #111; padding: 20px; max-width: 600px;">
      <h2>Подтверждение записи #${booking.id}</h2>
      <p>Здравствуйте, ${booking.name}!</p>
      <p>Вы успешно записаны в студию ATELIER.</p>
      
      <div style="background: #f4f4f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 4px 0;"><strong>Дата:</strong> ${booking.date}</p>
        <p style="margin: 4px 0;"><strong>Время:</strong> ${booking.time}</p>
        <p style="margin: 4px 0;"><strong>Мастер:</strong> ${booking.masterName || "Любой свободный"}</p>
        <p style="margin: 4px 0;"><strong>Сумма:</strong> ${booking.totalPrice} ${booking.currency}</p>
      </div>

      <p style="margin-top: 24px; color: #555;">
        Если вам нужно изменить время или отменить запись:
      </p>
      
      <div style="margin-top: 16px;">
        <a
          href="${rescheduleUrl}"
          style="display: inline-block; background: #000000; color: #ffffff; padding: 12px 20px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 14px; margin-right: 8px;"
        >
          Перенести запись
        </a>

        <a
          href="${cancelUrl}"
          style="display: inline-block; background: #ffffff; color: #e11d48; border: 1px solid #e11d48; padding: 11px 20px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 14px;"
        >
          Отменить запись
        </a>
      </div>
    </div>
  `;
}

export function getBookingCancelledHtml(bookingId: string, name: string): string {
  return `
    <div style="font-family: sans-serif; color: #111; padding: 20px; max-width: 600px;">
      <h2>Запись #${bookingId} отменена</h2>
      <p>Здравствуйте, ${name}!</p>
      <p>Ваша запись <strong>#${bookingId}</strong> была успешно отменена.</p>
      <p>Если ваши планы изменятся, мы всегда будем рады видеть вас в ATELIER!</p>
    </div>
  `;
}
