import { NextResponse } from "next/server";
import { buildSlots } from "@/features/availability/slots";
import { MAX_ITEMS, exceedsWorkday, mastersForItems, summarize, toLines } from "@/features/booking/selection";
import { getAvailability } from "@/features/availability/availability-service";
import { bookingRepository } from "@/features/booking/booking-repository";
import { notifyBooking } from "@/features/notifications";
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
  email?: string;
  telegram?: string;
  comment?: string;
  photos?: BookingPhoto[];
  agreedToTerms?: boolean; // 👈 Privacy policy consent flag
}

function validatePhotos(photos: BookingPhoto[] | undefined): {
  clean: BookingPhoto[];
  error?: string;
} {
  if (!photos?.length) return { clean: [] };
  if (!Array.isArray(photos)) return { clean: [], error: "Invalid photo format" };
  if (photos.length > uploads.maxFiles) {
    return { clean: [], error: `Maximum ${uploads.maxFiles} photos allowed` };
  }

  const clean: BookingPhoto[] = [];
  for (const p of photos) {
    const match = /^data:(image\/[a-z+.-]+);base64,/i.exec(p?.dataUrl ?? "");
    if (!match) return { clean: [], error: "File does not appear to be an image" };
    if (!uploads.acceptMime.includes(match[1].toLowerCase() as never)) {
      return { clean: [], error: "Image format is not supported" };
    }

    const base64 = p.dataUrl.slice(p.dataUrl.indexOf(",") + 1);
    const bytes = Math.round(base64.length * 0.75);
    if (bytes > uploads.maxBytes) return { clean: [], error: "Photo file size is too large" };

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
      { ok: false, error: "Invalid JSON request body" },
      { status: 400 },
    );
  }

  const fields: Record<string, string> = {};

  const rawItems = Array.isArray(body.items) ? body.items.slice(0, MAX_ITEMS) : [];
  const summary = summarize(rawItems);

  if (summary.items.length === 0) fields.items = "Select at least one procedure";
  else if (summary.items.length !== rawItems.length)
    fields.items = "One of the selected procedures is no longer available";

  const uniqueServices = new Set(rawItems.map((i) => i.serviceId));
  if (uniqueServices.size !== rawItems.length) fields.items = "Duplicate procedure selected";

  if (!body.date || !/^\d{4}-\d{2}-\d{2}$/.test(body.date)) fields.date = "Please select a date";
  if (!body.time || !/^\d{2}:\d{2}$/.test(body.time)) fields.time = "Please select a time";
  if (!body.name || body.name.trim().length < 2) fields.name = "Enter your full name";
  if (!body.phone || body.phone.replace(/\D/g, "").length < 9) fields.phone = "Check your phone number";

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!body.email || !emailRegex.test(body.email.trim())) {
    fields.email = "Enter a valid email address";
  }

  // 🟢 Terms & privacy consent validation
  if (!body.agreedToTerms) {
    fields.agreedToTerms = "Необходимо согласие на обработку персональных данных";
  }

  const photos = validatePhotos(body.photos);
  if (photos.error) fields.photos = photos.error;

  const masterId = body.masterId ?? null;
  const availability = await getAvailability(masterId);

  if (masterId && !availability.masters.some((m) => m.id === masterId)) {
    fields.masterId = "This specialist is no longer accepting bookings";
  } else if (masterId && !mastersForItems(availability.masters, rawItems).some((m) => m.id === masterId)) {
    fields.masterId = "The chosen specialist does not perform one of these procedures";
  }

  if (exceedsWorkday(availability, summary.durationMin)) {
    fields.items = "Selected procedures exceed total working hours for a single visit";
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
    if (!slot) fields.time = "No available time slots on this date";
    else if (!slot.available) fields.time = "This slot was just taken — please choose another time";
  }

  if (Object.keys(fields).length > 0) {
    return NextResponse.json<ApiResult<never>>(
      { ok: false, error: "Please check form fields for errors", fields },
      { status: 422 },
    );
  }

  const master = availability.masters.find((m) => m.id === masterId) ?? null;

  const record = await bookingRepository.create({
    lines: toLines(rawItems),
    masterId: master?.id ?? null,
    masterName: master?.name ?? "Any available",
    totalDurationMin: summary.durationMin,
    totalPrice: summary.price,
    currency: summary.currency,
    date: body.date!,
    time: body.time!,
    name: body.name!.trim(),
    phone: body.phone!.trim(),
    email: body.email!.trim(),
    telegram: body.telegram?.trim() || undefined,
    comment: body.comment?.trim() || undefined,
    photos: photos.clean,
    source: "web",
  });

  // 🟢 Single entry point for dispatching notifications (Telegram + Email)
  const delivery = await notifyBooking(record);

  return NextResponse.json<ApiResult<BookingRecord & { delivery: typeof delivery }>>({
    ok: true,
    data: { ...record, delivery },
  });
}

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
      { ok: false, error: "Parameters 'date' and 'items' are required" },
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
