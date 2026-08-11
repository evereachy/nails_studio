import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  adminCookieName,
  checkPassword,
  cookieOptions,
  isAdminConfigured,
  issueToken,
  verifyToken,
} from "@/lib/auth/admin-auth";

export const runtime = "nodejs";

/** Active session check — admin panel queries this on load */
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
      { ok: false, error: "ADMIN_PASSWORD is not configured on the server" },
      { status: 503 },
    );
  }

  const { password } = (await request.json().catch(() => ({}))) as { password?: string };

  if (!password || !checkPassword(password)) {
    // Artificial delay to prevent brute-force attacks
    await new Promise((r) => setTimeout(r, 700));
    return NextResponse.json({ ok: false, error: "Invalid password" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(adminCookieName, issueToken(), cookieOptions);
  return res;
}

/** Logout */
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(adminCookieName, "", { ...cookieOptions, maxAge: 0 });
  return res;
}
