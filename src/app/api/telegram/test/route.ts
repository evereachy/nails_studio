import { NextResponse } from "next/server";
import { tgCall } from "@/services/notifications/telegram";
import { notifyBooking } from "@/services/notifications";
import type { BookingRecord } from "@/types";

export const runtime = "nodejs";

/**
 * Диагностика подключения Telegram. Нужна ровно один раз — при настройке.
 *
 * GET /api/telegram/test?mode=info   — жив ли бот, как его зовут
 * GET /api/telegram/test?mode=chats  — показать chat_id всех чатов, где бот получал сообщения
 * GET /api/telegram/test?mode=send   — отправить тестовую заявку в рабочий чат
 *
 * В проде закрыт: нужен ?key=, совпадающий с TELEGRAM_TEST_KEY.
 * Без ключа в проде роут отвечает 404 — чтобы не светить сам факт его существования.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const isProd = process.env.NODE_ENV === "production";
  const key = process.env.TELEGRAM_TEST_KEY;

  if (isProd && (!key || searchParams.get("key") !== key)) {
    return new NextResponse("Not found", { status: 404 });
  }

  const mode = searchParams.get("mode") ?? "info";

  try {
    if (mode === "info") {
      const me = await tgCall("getMe", {});
      return NextResponse.json({
        ok: true,
        bot: me.result,
        chatIdSet: Boolean(process.env.TELEGRAM_CHAT_ID),
        threadIdSet: Boolean(process.env.TELEGRAM_THREAD_ID),
      });
    }

    if (mode === "chats") {
      // Помогает найти chat_id: напишите что-нибудь в группе и обновите страницу.
      const updates = await tgCall("getUpdates", { limit: 20 });
      const chats = (updates.result as Array<Record<string, any>>) // eslint-disable-line @typescript-eslint/no-explicit-any
        .map((u) => u.message?.chat ?? u.channel_post?.chat)
        .filter(Boolean)
        .map((c) => ({ id: c.id, type: c.type, title: c.title ?? c.username }));

      const unique = Array.from(new Map(chats.map((c) => [c.id, c])).values());
      return NextResponse.json({
        ok: true,
        chats: unique,
        hint: unique.length
          ? "Скопируйте id нужного чата в TELEGRAM_CHAT_ID"
          : "Напишите любое сообщение в группе с ботом и обновите страницу",
      });
    }

    if (mode === "send") {
      const sample: BookingRecord = {
        id: "TEST",
        serviceId: "haircut",
        serviceTitle: "Стрижка",
        durationMin: 90,
        price: 1200,
        currency: "Kč",
        date: new Date().toISOString().slice(0, 10),
        time: "14:00",
        name: "Проверка связи",
        phone: "+420 777 000 000",
        comment: "Это тестовая заявка, отвечать не нужно",
        photos: [],
        source: "web",
        createdAt: new Date().toISOString(),
        status: "new",
      };
      const delivery = await notifyBooking(sample);
      return NextResponse.json({ ok: true, delivery });
    }

    return NextResponse.json({ ok: false, error: "mode: info | chats | send" }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 502 });
  }
}
