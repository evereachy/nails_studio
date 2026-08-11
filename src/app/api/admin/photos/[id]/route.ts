import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminCookieName, verifyToken } from "@/lib/auth/admin-auth";
import { photoRepository } from "@/features/booking/photo-repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Serves a single photo for a booking.
 * Protected by authorization: these are client photos, and a predictable
 * public URL would expose them to anyone guessing the booking ID.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const jar = await cookies();
  if (!verifyToken(jar.get(adminCookieName)?.value)) {
    return new NextResponse("Not found", { status: 404 });
  }

  const { id } = await params;

  try {
    const photo = await photoRepository.get(id);
    if (!photo) return new NextResponse("Not found", { status: 404 });

    return new NextResponse(new Uint8Array(photo.bytes), {
      headers: {
        "Content-Type": photo.mime,
        "Content-Length": String(photo.size),
        // Private cache: image won't change, but shouldn't be stored in a CDN
        "Cache-Control": "private, max-age=3600",
        "Content-Disposition": `inline; filename="${encodeURIComponent(photo.name)}"`,
      },
    });
  } catch (e) {
    console.error("[admin/photos]", e);
    return new NextResponse("Error", { status: 500 });
  }
}
