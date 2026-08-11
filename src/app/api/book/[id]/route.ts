import { NextResponse } from "next/server";
import { bookingRepository } from "@/features/booking/booking-repository";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const booking = await bookingRepository.getById(id);

    if (!booking) {
      return NextResponse.json(
        { ok: false, error: "Booking not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ ok: true, data: booking });
  } catch (err) {
    console.error("[booking-get-error]", err);
    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
