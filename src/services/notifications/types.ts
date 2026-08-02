import type { BookingRecord } from "@/types";

/**
 * Контракт канала уведомлений.
 * Любой новый канал (WhatsApp, SMS, Email, Push) реализует этот интерфейс
 * и регистрируется в services/notifications/index.ts. Больше нигде код не меняется.
 */
export interface NotificationChannel {
  id: string;
  /** канал сконфигурирован (есть ключи) — иначе работаем в dry-run */
  isConfigured(): boolean;
  send(booking: BookingRecord): Promise<void>;
}

export interface NotificationResult {
  channel: string;
  ok: boolean;
  error?: string;
  dryRun?: boolean;
}
