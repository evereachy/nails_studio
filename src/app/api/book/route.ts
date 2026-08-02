import { NextResponse } from "next/server";
import { getService } from "@/config/catalog";
import { buildSlots } from "@/lib/slots";
import { bookingRepository } from "@/services/booking-repository";
import { notifyBooking } from "@/services/notifications";
import { uploads } from "@/config/uploads";
import type { ApiResult, BookingPhoto, BookingRecord } from "@/types";

export const runtime = "nodejs";

interface Body {
  serviceId?: string;
  date?: string;
  time?: string;
  name?: string;
  phone?: string;
  comment?: string;
  photos?: BookingPhoto[];
}

/**
 * Фото приходят как data-URL внутри JSON. Клиент их уже сжал,
 * но доверять клиенту нельзя: проверяем формат, количество и вес заново.
 */
function validatePhotos(photos: BookingPhoto[] | undefined): {
  clean: BookingPhoto[];
  error?: string;
} {
  if (!photos?.length) return { clean: [] };
  if (!Array.isArray(photos)) return { clean: [], error: "Некорректный формат фото" };
  if (photos.length > uploads.maxFiles) {
    return { clean: [], error: `Не больше ${uploads.maxFiles} фото` };
  }

  const clean: BookingPhoto[] = [];
  for (const p of photos) {
    const match = /^data:(image\/[a-z+.-]+);base64,/i.exec(p?.dataUrl ?? "");
    if (!match) return { clean: [], error: "Файл не похож на изображение" };
    if (!uploads.acceptMime.includes(match[1].toLowerCase() as never)) {
      return { clean: [], error: "Такой формат изображения не поддерживается" };
    }

    const base64 = p.dataUrl.slice(p.dataUrl.indexOf(",") + 1);
    const bytes = Math.round(base64.length * 0.75);
    if (bytes > uploads.maxBytes) return { clean: [], error: "Фото слишком тяжёлое" };

    clean.push({
      id: String(p.id ?? "").slice(0, 40) || `p-${clean.length}`,
      name: String(p.name ?? "photo.jpg").slice(0, 80),
      dataUrl: p.dataUrl,
      size: bytes,
    });
  }
  return { clean };
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

  const photos = validatePhotos(body.photos);
  if (photos.error) fields.photos = photos.error;

  return { service, fields, photos: photos.clean };
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

  const { service, fields, photos } = validate(body);
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
    photos,
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