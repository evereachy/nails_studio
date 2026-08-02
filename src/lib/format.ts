/** Форматирование под локаль. Локаль вынесена — легко переключить на cs-CZ / en-US. */
export const LOCALE = "ru-RU";

export function formatPrice(value: number, currency: string) {
  return `${new Intl.NumberFormat(LOCALE).format(value)} ${currency}`;
}

export function formatDuration(min: number) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h && m) return `${h} ч ${m} мин`;
  if (h) return `${h} ч`;
  return `${m} мин`;
}

/** "2026-08-12" -> { day: "12", weekday: "ср", month: "авг" } */
export function splitDate(iso: string) {
  const d = new Date(`${iso}T00:00:00`);
  return {
    day: String(d.getDate()),
    weekday: d.toLocaleDateString(LOCALE, { weekday: "short" }),
    month: d.toLocaleDateString(LOCALE, { month: "short" }),
  };
}

export function formatDateLong(iso: string) {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString(LOCALE, { day: "numeric", month: "long" });
}

export function toISODate(d: Date) {
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 10);
}

/** Маска телефона под чешский формат. Заменяется одной функцией. */
export function maskPhone(raw: string) {
  const digits = raw.replace(/[^\d+]/g, "");
  if (!digits) return "";
  const plus = digits.startsWith("+");
  const nums = digits.replace(/\D/g, "").slice(0, 12);
  const groups = nums.match(/.{1,3}/g) ?? [];
  return (plus ? "+" : "") + groups.join(" ");
}

export function isValidPhone(raw: string) {
  return raw.replace(/\D/g, "").length >= 9;
}
