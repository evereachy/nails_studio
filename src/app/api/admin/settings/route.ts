import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminCookieName, verifyToken } from "@/lib/admin-auth";
import { settingsRepository } from "@/services/settings-repository";
import type { Master, SalonSettings } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function guard() {
  const jar = await cookies();
  return verifyToken(jar.get(adminCookieName)?.value);
}

const TIME = /^([01]\d|2[0-3]):([0-5]\d)$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Санитайзер настроек.
 * Админка — тоже клиент, и из неё в базу не должно попасть ничего,
 * что потом уронит расчёт слотов: время закрытия раньше открытия,
 * шаг сетки в ноль или горизонт на десять лет.
 */
function cleanSettings(input: SalonSettings): { value?: SalonSettings; error?: string } {
  const workingHours = [0, 1, 2, 3, 4, 5, 6].map((weekday) => {
    const day = input.workingHours?.find((d) => d.weekday === weekday);
    if (!day?.open || !day?.close) return { weekday, open: null, close: null };

    if (!TIME.test(day.open) || !TIME.test(day.close)) {
      throw new Error(`Некорректное время в дне ${weekday}`);
    }
    if (day.open >= day.close) {
      throw new Error(`Закрытие раньше открытия в дне ${weekday}`);
    }
    return { weekday, open: day.open, close: day.close };
  });

  const closedDates = Array.from(new Set(input.closedDates ?? []))
    .filter((d) => DATE.test(d))
    .sort();

  const slotStepMin = Math.min(120, Math.max(5, Math.round(input.slotStepMin || 30)));
  const horizonDays = Math.min(365, Math.max(1, Math.round(input.horizonDays || 60)));

  if (workingHours.every((d) => !d.open)) {
    return { error: "Нельзя закрыть все дни недели — записаться будет некуда" };
  }

  return { value: { workingHours, closedDates, slotStepMin, horizonDays } };
}

function cleanMasters(input: Master[]): Master[] {
  return (input ?? [])
    .filter((m) => m?.name?.trim())
    .map((m, i) => ({
      id: (m.id || `m${i}`).toString().slice(0, 40),
      name: m.name.trim().slice(0, 60),
      role: (m.role ?? "").trim().slice(0, 80),
      avatar: m.avatar,
      active: m.active !== false,
      serviceIds: Array.isArray(m.serviceIds) ? m.serviceIds : [],
      weekdaysOff: Array.isArray(m.weekdaysOff)
        ? m.weekdaysOff.filter((d) => d >= 0 && d <= 6)
        : [],
    }));
}

export async function GET() {
  if (!(await guard())) return NextResponse.json({ ok: false }, { status: 401 });
  return NextResponse.json({ ok: true, data: await settingsRepository.read() });
}

export async function PUT(request: Request) {
  if (!(await guard())) return NextResponse.json({ ok: false }, { status: 401 });

  const body = (await request.json().catch(() => null)) as {
    settings?: SalonSettings;
    masters?: Master[];
  } | null;

  if (!body?.settings) {
    return NextResponse.json({ ok: false, error: "Нет данных" }, { status: 400 });
  }

  try {
    const { value, error } = cleanSettings(body.settings);
    if (error || !value) {
      return NextResponse.json({ ok: false, error: error ?? "Ошибка" }, { status: 422 });
    }

    const store = await settingsRepository.write({
      settings: value,
      masters: cleanMasters(body.masters ?? []),
    });

    return NextResponse.json({ ok: true, data: store });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 422 });
  }
}
