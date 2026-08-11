import { NextResponse } from "next/server";
import { getAvailability } from "@/features/availability/availability-service";

export const runtime = "nodejs";

/**
 * Dynamic route: availability changes in real time (via admin updates or new bookings),
 * so responses must never be cached statically.
 */
export const dynamic = "force-dynamic";

/** GET /api/availability?masterId=anna — fetches schedule and slot availability for a given master */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const masterId = searchParams.get("masterId");

  try {
    const data = await getAvailability(masterId || null);
    return NextResponse.json({ ok: true, data });
  } catch (e) {
    console.error("[availability]", e);
    return NextResponse.json(
      { ok: false, error: "Failed to load schedule" },
      { status: 503 },
    );
  }
}
