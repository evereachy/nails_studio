import { NextResponse } from "next/server";
import {
  adminCookieName,
  checkPassword,
  cookieOptions,
  isAdminConfigured,
  issueToken,
  verifyToken,
} from "@/lib/admin-auth";
import { cookies } from "next/headers";

export const runtime = "nodejs";

/** Проверка активной сессии — админка спрашивает при загрузке */
export async function GET() {
  const jar = await cookies();
  return NextResponse.json({
    ok: true,
    authorized: verifyToken(jar.get(adminCookieName)?.value),
    configured: isAdminConfigured,
  });
}

export async function POST(request: Request) {
  if (!isAdminConfigured) {
    return NextResponse.json(
      { ok: false, error: "ADMIN_PASSWORD не задан на сервере" },
      { status: 503 },
    );
  }

  const { password } = (await request.json().catch(() => ({}))) as { password?: string };

  if (!password || !checkPassword(password)) {
    // Пауза против перебора: без неё пароль подбирается сотнями попыток в секунду
    await new Promise((r) => setTimeout(r, 700));
    return NextResponse.json({ ok: false, error: "Неверный пароль" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(adminCookieName, issueToken(), cookieOptions);
  return res;
}

/** Выход */
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(adminCookieName, "", { ...cookieOptions, maxAge: 0 });
  return res;
}
