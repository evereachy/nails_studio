import type { NotificationChannel } from "./types";

/**
 * Заглушки под будущие каналы. Логика внутри send() дописывается позже —
 * подключение к системе уже готово.
 */
export const emailChannel: NotificationChannel = {
  id: "email",
  isConfigured: () => Boolean(process.env.RESEND_API_KEY),
  async send() {
    // TODO: Resend / Nodemailer
  },
};

export const whatsappChannel: NotificationChannel = {
  id: "whatsapp",
  isConfigured: () => Boolean(process.env.WHATSAPP_TOKEN),
  async send() {
    // TODO: WhatsApp Cloud API
  },
};

export const smsChannel: NotificationChannel = {
  id: "sms",
  isConfigured: () => Boolean(process.env.TWILIO_SID),
  async send() {
    // TODO: Twilio
  },
};
