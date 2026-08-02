import { NextResponse } from "next/server";
import { getService } from "@/config/catalog";
import { buildSlots } from "@/lib/slots";
import { bookingRepository } from "@/services/booking-repository";
import { notifyBooking } from "@/services/notifications";
import type { ApiResult, BookingRecord } from "@/types";

export const runtime = "nodejs";

interface Body {
  serviceId?: string;
  date?: string;
  time?: string;
  name?: string;
  phone?: string;
  comment?: string;
}

/** Валидация на сервере. Клиентская — только для UX, доверять ей нельзя. */
function validate(body: Body) {
  const fields: Record<string, string> = {};

  const service = getService(body.serviceId ?? null);
  if (!service) fields.serviceId = "Выберите услугу";
  if (!body.date || !/^\d{4}-\d{2}-\d{2}$/.test(body.date)) fields.date = "Выберите дату";
  if (!body.time || !/^\d{2}:\d{2}$/.test(body.time)) fields.time = "Выберите время";
  if (!body.name || body.name.trim().length < 2) fields.name = "Введите имя";
  if (!body.phone || body.phone.replace(/\D/g, "").length < 9) fields.phone = "Проверьте номер";

  // слот всё ещё свободен?
  if (service && body.date && body.time && !fields.date && !fields.time) {
    const slot = buildSlots(body.date, service.durationMin).find((s) => s.time === body.time);
    if (!slot) fields.time = "В этот день такого времени нет";
    else if (!slot.available) fields.time = "Это время уже заняли — выберите другое";
  }

  return { service, fields };
}

export async function POST(request: Request) {
  let body: Body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json<ApiResult<never>>(
      { ok: false, error: "Некорректный запрос" },
      { status: 400 },
    );
  }

  const { service, fields } = validate(body);
  if (!service || Object.keys(fields).length > 0) {
    return NextResponse.json<ApiResult<never>>(
      { ok: false, error: "Проверьте поля формы", fields },
      { status: 422 },
    );
  }

  const record = await bookingRepository.create({
    serviceId: service.id,
    serviceTitle: service.title,
    durationMin: service.durationMin,
    price: service.price,
    currency: service.currency,
    date: body.date!,
    time: body.time!,
    name: body.name!.trim(),
    phone: body.phone!.trim(),
    comment: body.comment?.trim() || undefined,
    source: "web",
  });

  // Уведомления не блокируют ответ клиенту дольше, чем нужно,
  // и не роняют бронь при недоступности Telegram.
  const delivery = await notifyBooking(record);

  return NextResponse.json<ApiResult<BookingRecord & { delivery: typeof delivery }>>({
    ok: true,
    data: { ...record, delivery },
  });
}

/** GET /api/book?date=YYYY-MM-DD&serviceId=... — свободные слоты */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");
  const service = getService(searchParams.get("serviceId"));

  if (!date || !service) {
    return NextResponse.json<ApiResult<never>>(
      { ok: false, error: "Нужны параметры date и serviceId" },
      { status: 400 },
    );
  }

  return NextResponse.json({ ok: true, data: buildSlots(date, service.durationMin) });
}
