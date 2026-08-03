import type { BookingRecord } from "@/types";
import type { NotificationChannel } from "./types";

export const whatsappChannel: NotificationChannel = {
  id: "whatsapp",

  isConfigured() {
    return Boolean(
      process.env.WHATSAPP_PHONE_NUMBER_ID &&
      process.env.WHATSAPP_ACCESS_TOKEN
    );
  },

  async send(booking: BookingRecord) {
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID!;
    const token = process.env.WHATSAPP_ACCESS_TOKEN!;

    // Format phone number to numbers only (e.g. 14155552671)
    const to = booking.phone.replace(/\D/g, "");

    const res = await fetch(
      `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to,
          type: "template",
          template: {
            name: "booking_confirmation",
            language: { code: "en_US" },
            components: [
              {
                type: "body",
                parameters: [
                  { type: "text", text: booking.name },
                  { type: "text", text: booking.lines.map((l) => l.serviceTitle).join(", ") },
                  { type: "text", text: `${booking.date} at ${booking.time}` },
                  { type: "text", text: `${booking.totalPrice} ${booking.currency}` },
                ],
              },
            ],
          },
        }),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error?.message || "WhatsApp API error");
    }
  },
};
