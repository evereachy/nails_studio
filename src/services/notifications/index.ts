import type { BookingRecord } from "@/types";
import { telegramChannel } from "./telegram";
import { emailChannel, smsChannel, whatsappChannel } from "./stubs";
import type { NotificationChannel, NotificationResult } from "./types";

/** Реестр каналов. Добавить новый — одна строка. */
const registry: Record<string, NotificationChannel> = {
  telegram: telegramChannel,
  email: emailChannel,
  whatsapp: whatsappChannel,
  sms: smsChannel,
};

function enabledChannels(): NotificationChannel[] {
  const list = (process.env.NOTIFY_CHANNELS ?? "telegram")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return list.map((id) => registry[id]).filter(Boolean);
}

/**
 * Рассылает запись по всем включённым каналам.
 * Падение одного канала не роняет заявку — клиент всё равно получит подтверждение.
 */
export async function notifyBooking(booking: BookingRecord): Promise<NotificationResult[]> {
  const results = await Promise.all(
    enabledChannels().map(async (channel): Promise<NotificationResult> => {
      if (!channel.isConfigured()) {
        // Демо-режим: ключей нет — пишем в консоль вместо отправки
        console.info(`[notify:${channel.id}] dry-run`, booking.id);
        return { channel: channel.id, ok: true, dryRun: true };
      }
      try {
        await channel.send(booking);
        return { channel: channel.id, ok: true };
      } catch (e) {
        console.error(`[notify:${channel.id}] failed`, e);
        return { channel: channel.id, ok: false, error: (e as Error).message };
      }
    }),
  );
  return results;
}

export { buildMessage } from "./telegram";
