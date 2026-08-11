/** Locale setting for formatting strings. Change here to switch to cs-CZ / en-US. */
export const LOCALE = "ru-RU";

export function formatPrice(value: number, currency: string): string {
  return `${new Intl.NumberFormat(LOCALE).format(value)} ${currency}`;
}

export function formatDuration(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h && m) return `${h} ч ${m} мин`;
  if (h) return `${h} ч`;
  return `${m} мин`;
}

/** Converts "2026-08-12" -> { day: "12", weekday: "ср", month: "авг" } */
export function splitDate(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  const d = new Date(year, (month || 1) - 1, day || 1);

  if (isNaN(d.getTime())) {
    return { day: "--", weekday: "--", month: "--" };
  }

  return {
    day: String(d.getDate()),
    weekday: d.toLocaleDateString(LOCALE, { weekday: "short" }),
    month: d.toLocaleDateString(LOCALE, { month: "short" }),
  };
}

export function formatDateLong(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number);
  const d = new Date(year, (month || 1) - 1, day || 1);

  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(LOCALE, { day: "numeric", month: "long" });
}

export function toISODate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Czech phone masking helper */
export function maskPhone(raw: string): string {
  const digits = raw.replace(/[^\d+]/g, "");
  if (!digits) return "";
  const plus = digits.startsWith("+");
  const nums = digits.replace(/\D/g, "").slice(0, 12);
  const groups = nums.match(/.{1,3}/g) ?? [];
  return (plus ? "+" : "") + groups.join(" ");
}

export function isValidPhone(raw: string): boolean {
  return raw.replace(/\D/g, "").length >= 9;
}
