import { NextResponse } from "next/server";
import { buildSlots } from "@/lib/slots";
import { MAX_ITEMS, exceedsWorkday, mastersForItems, summarize, toLines } from "@/lib/selection";
import { getAvailability } from "@/services/availability";
import { bookingRepository } from "@/services/booking-repository";
import { notifyBooking } from "@/services/notifications";
import { uploads } from "@/config/uploads";
import type { ApiResult, BookingItem, BookingPhoto, BookingRecord } from "@/types";

export const runtime = "nodejs";

interface Body {
  items?: BookingItem[];
  masterId?: string | null;
  date?: string;
  time?: string;
  name?: string;
  phone?: string;
  telegram?: string;
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

  const fields: Record<string, string> = {};

  /**
   * Цены и длительности НЕ берутся из запроса: клиент присылает только id
   * услуги и варианта, всё остальное считается заново по каталогу.
   * Иначе достаточно подменить тело запроса, чтобы записаться за бесценок.
   */
  const rawItems = Array.isArray(body.items) ? body.items.slice(0, MAX_ITEMS) : [];
  const summary = summarize(rawItems);

  if (summary.items.length === 0) fields.items = "Выберите хотя бы одну процедуру";
  else if (summary.items.length !== rawItems.length)
    fields.items = "Одна из процедур больше не доступна";

  const uniqueServices = new Set(rawItems.map((i) => i.serviceId));
  if (uniqueServices.size !== rawItems.length) fields.items = "Процедура выбрана дважды";

  if (!body.date || !/^\d{4}-\d{2}-\d{2}$/.test(body.date)) fields.date = "Выберите дату";
  if (!body.time || !/^\d{2}:\d{2}$/.test(body.time)) fields.time = "Выберите время";
  if (!body.name || body.name.trim().length < 2) fields.name = "Введите имя";
  if (!body.phone || body.phone.replace(/\D/g, "").length < 9) fields.phone = "Проверьте номер";

  const photos = validatePhotos(body.photos);
  if (photos.error) fields.photos = photos.error;

  // График и занятость берём из того же источника, что и клиент,
  // но заново: пока человек заполнял форму, управляющая могла закрыть день,
  // а соседнюю бронь — поставить на это же окно.
  const masterId = body.masterId ?? null;
  const availability = await getAvailability(masterId);

  if (masterId && !availability.masters.some((m) => m.id === masterId)) {
    fields.masterId = "Этот мастер больше не принимает";
  } else if (masterId && !mastersForItems(availability.masters, rawItems).some((m) => m.id === masterId)) {
    fields.masterId = "Мастер не делает одну из выбранных процедур";
  }

  if (exceedsWorkday(availability, summary.durationMin)) {
    fields.items = "Столько процедур не помещается в один визит";
  }

  if (
    summary.durationMin &&
    body.date &&
    body.time &&
    !fields.items &&
    !fields.date &&
    !fields.time &&
    !fields.masterId
  ) {
    const slot = buildSlots(availability, body.date, summary.durationMin).find(
      (s) => s.time === body.time,
    );
    if (!slot) fields.time = "В этот день такого времени нет";
    else if (!slot.available) fields.time = "Это время уже заняли — выберите другое";
  }

  if (Object.keys(fields).length > 0) {
    return NextResponse.json<ApiResult<never>>(
      { ok: false, error: "Проверьте поля формы", fields },
      { status: 422 },
    );
  }

  const master = availability.masters.find((m) => m.id === masterId) ?? null;

  const record = await bookingRepository.create({
    lines: toLines(rawItems),
    masterId: master?.id ?? null,
    masterName: master?.name ?? "любой свободный",
    totalDurationMin: summary.durationMin,
    totalPrice: summary.price,
    currency: summary.currency,
    date: body.date!,
    time: body.time!,
    name: body.name!.trim(),
    phone: body.phone!.trim(),
    telegram: body.telegram?.trim() || undefined,
    comment: body.comment?.trim() || undefined,
    photos: photos.clean,
    source: "web",
  });

  // Уведомления не роняют бронь при недоступности Telegram.
  const delivery = await notifyBooking(record);

  return NextResponse.json<ApiResult<BookingRecord & { delivery: typeof delivery }>>({
    ok: true,
    data: { ...record, delivery },
  });
}

/**
 * GET /api/book?date=YYYY-MM-DD&items=haircut:medium,manicure:gel&masterId=anna
 * Свободные слоты под суммарную длительность выбранного набора.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");

  const items: BookingItem[] = (searchParams.get("items") ?? "")
    .split(",")
    .filter(Boolean)
    .map((pair) => {
      const [serviceId, variantId] = pair.split(":");
      return { serviceId, variantId };
    });

  const summary = summarize(items);

  if (!date || summary.items.length === 0) {
    return NextResponse.json<ApiResult<never>>(
      { ok: false, error: "Нужны параметры date и items" },
      { status: 400 },
    );
  }

  const availability = await getAvailability(searchParams.get("masterId"));

  return NextResponse.json({
    ok: true,
    data: buildSlots(availability, date, summary.durationMin),
    totalDurationMin: summary.durationMin,
  });
}
