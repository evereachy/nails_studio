import { NextRequest, NextResponse } from "next/server";

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN!; // положите в .env

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("WhatsApp webhook verified");
    return new NextResponse(challenge, { status: 200 });
  }

  return new NextResponse("Forbidden", { status: 403 });
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  // Всегда сразу отвечаем 200
  // Meta будет повторять запрос, если не получит быстрый 200
  const response = new NextResponse("EVENT_RECEIVED", { status: 200 });

  try {
    if (body.object === "whatsapp_business_account") {
      for (const entry of body.entry ?? []) {
        for (const change of entry.changes ?? []) {
          if (change.field === "messages") {
            const value = change.value;

            // Входящие сообщения
            if (value.messages) {
              const message = value.messages[0];
              console.log("Incoming WhatsApp message:", message);
              // Здесь ваша логика (уведомление, сохранение в БД и т.д.)
            }

            // Статусы доставки
            if (value.statuses) {
              console.log("Message status:", value.statuses[0]);
            }
          }
        }
      }
    }
  } catch (error) {
    console.error("Webhook error:", error);
  }

  return response;
}
