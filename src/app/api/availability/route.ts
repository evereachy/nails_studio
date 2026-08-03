import { NextResponse } from "next/server";
import { getAvailability } from "@/services/availability";

export const runtime = "nodejs";
/** Расписание меняется в админке — кэшировать ответ нельзя */
export const dynamic = "force-dynamic";

/** GET /api/availability?masterId=anna — график и занятость для выбранного мастера */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const masterId = searchParams.get("masterId");

  try {
    const data = await getAvailability(masterId || null);
    return NextResponse.json({ ok: true, data });
  } catch (e) {
    console.error("[availability]", e);
    return NextResponse.json(
      { ok: false, error: "Не удалось загрузить расписание" },
      { status: 503 },
    );
  }
}
