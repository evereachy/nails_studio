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

const corsHeaders = {
  "Access-Control-Allow-Origin": "http://localhost:3000",
  "Access-Control-Allow-Credentials": "true",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

/** Handle Browser Preflight Requests */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

/** Active session check */
export async function GET() {
  const jar = await cookies();
  return NextResponse.json(
    {
      ok: true,
      authorized: verifyToken(jar.get(adminCookieName)?.value),
      configured: isAdminConfigured,
    },
    { headers: corsHeaders }
  );
}

export async function POST(request: Request) {
  if (!isAdminConfigured) {
    return NextResponse.json(
      { ok: false, error: "ADMIN_PASSWORD is not configured on the server" },
      { status: 503, headers: corsHeaders },
    );
  }

  const { password } = (await request.json().catch(() => ({}))) as { password?: string };

  if (!password || !checkPassword(password)) {
    await new Promise((r) => setTimeout(r, 700));
    return NextResponse.json(
      { ok: false, error: "Invalid password" },
      { status: 401, headers: corsHeaders }
    );
  }

  const res = NextResponse.json({ ok: true }, { headers: corsHeaders });
  res.cookies.set(adminCookieName, issueToken(), {
    ...cookieOptions,
    sameSite: "lax", // Ensure cookie works across local rewrites
  });
  return res;
}

/** Logout */
export async function DELETE() {
  const res = NextResponse.json({ ok: true }, { headers: corsHeaders });
  res.cookies.set(adminCookieName, "", { ...cookieOptions, maxAge: 0 });
  return res;
}
