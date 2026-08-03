import { createHmac, timingSafeEqual } from "crypto";

const PASSWORD = process.env.ADMIN_PASSWORD ?? "";
const SECRET = process.env.ADMIN_SECRET ?? PASSWORD;
const COOKIE = "salon_admin";
const TTL_HOURS = 12;

export const adminCookieName = COOKIE;
export const isAdminConfigured = Boolean(PASSWORD);

function sign(payload: string) {
  return createHmac("sha256", SECRET).update(payload).digest("hex");
}

/** Сравнение без утечки времени — иначе пароль подбирается по задержке ответа */
function safeEqual(a: string, b: string) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export function checkPassword(input: string) {
  if (!PASSWORD) return false;
  return safeEqual(input, PASSWORD);
}

/**
 * Токен = срок действия + подпись. Состояние сессии на сервере не храним:
 * инстансов может быть несколько, общей памяти у них нет.
 */
export function issueToken() {
  const expires = Date.now() + TTL_HOURS * 3600_000;
  return `${expires}.${sign(String(expires))}`;
}

export function verifyToken(token: string | undefined) {
  if (!token || !SECRET) return false;

  const [expires, signature] = token.split(".");
  if (!expires || !signature) return false;
  if (Number(expires) < Date.now()) return false;

  return safeEqual(signature, sign(expires));
}

export const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: TTL_HOURS * 3600,
};
