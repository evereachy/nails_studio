import { bookingRepository } from "@/services/booking-repository";
import { NextResponse } from "next/server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {

    const { id } = await params;

    const booking = await bookingRepository.getById(id);

    if (!booking) {
      return NextResponse.json(
        { ok: false, error: "Запись не найдена" },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, data: booking });
  } catch (err) {
    console.error("[booking-get-error]", err);
    return NextResponse.json(
      { ok: false, error: "Ошибка сервера" },
      { status: 500 }
    );
  }
}
