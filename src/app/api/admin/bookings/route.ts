import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminCookieName, verifyToken } from "@/lib/admin-auth";
import { bookingRepository } from "@/services/booking-repository";
import type { BookingRecord } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function guard() {
  const jar = await cookies();
  return verifyToken(jar.get(adminCookieName)?.value);
}

export async function GET() {
  if (!(await guard())) return NextResponse.json({ ok: false }, { status: 401 });
  return NextResponse.json({ ok: true, data: await bookingRepository.listAll(200) });
}

/** Подтвердить или отменить запись */
export async function PATCH(request: Request) {
  if (!(await guard())) return NextResponse.json({ ok: false }, { status: 401 });

  const { id, status } = (await request.json().catch(() => ({}))) as {
    id?: string;
    status?: BookingRecord["status"];
  };

  if (!id || !status || !["new", "confirmed", "cancelled"].includes(status)) {
    return NextResponse.json({ ok: false, error: "Нужны id и status" }, { status: 400 });
  }

  const record = await bookingRepository.setStatus(id, status);
  if (!record) return NextResponse.json({ ok: false, error: "Запись не найдена" }, { status: 404 });

  return NextResponse.json({ ok: true, data: record });
}
