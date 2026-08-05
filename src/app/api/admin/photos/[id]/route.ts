import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminCookieName, verifyToken } from "@/lib/admin-auth";
import { photoRepository } from "@/services/photo-repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Отдаёт одно фото записи. Под авторизацией: это личные снимки клиентов,
 * и предсказуемый публичный URL сделал бы их доступными любому,
 * кто угадает id брони.
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
        // Приватный кэш: картинка не меняется, но в CDN ей не место
        "Cache-Control": "private, max-age=3600",
        "Content-Disposition": `inline; filename="${encodeURIComponent(photo.name)}"`,
      },
    });
  } catch (e) {
    console.error("[admin/photos]", e);
    return new NextResponse("Error", { status: 500 });
  }
}
