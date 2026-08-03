import { getService, getVariant } from "@/config/catalog";
import { longestWorkday } from "@/lib/slots";
import type {
  BookingItem,
  BookingLine,
  ResolvedItem,
  ScheduleContext,
  SelectionSummary,
} from "@/types";

/** Сколько позиций можно взять в один визит */
export const MAX_ITEMS = 4;

/**
 * Разворачивает выбор в полные объекты и считает итог.
 * Используется и на клиенте (показать сумму), и на сервере (проверить её заново) —
 * поэтому живёт в lib, а не в компоненте.
 */
export function summarize(items: BookingItem[]): SelectionSummary {
  const resolved: ResolvedItem[] = [];

  for (const item of items) {
    const service = getService(item.serviceId);
    const variant = getVariant(item.serviceId, item.variantId);
    if (service && variant) resolved.push({ service, variant });
  }

  return {
    items: resolved,
    durationMin: resolved.reduce((sum, r) => sum + r.variant.durationMin, 0),
    price: resolved.reduce((sum, r) => sum + r.variant.price, 0),
    currency: resolved[0]?.service.currency ?? "Kč",
  };
}

/** Плоский вид для отправки на сервер и в чат */
export function toLines(items: BookingItem[]): BookingLine[] {
  return summarize(items).items.map(({ service, variant }) => ({
    serviceId: service.id,
    variantId: variant.id,
    serviceTitle: service.title,
    variantLabel: variant.label,
    durationMin: variant.durationMin,
    price: variant.price,
  }));
}

/**
 * Набор из четырёх процедур легко перевалит за рабочий день.
 * Тогда buildSlots честно вернёт пустой список, и человек увидит
 * «нет времени» вместо понятного «всё вместе не помещается в один визит».
 * Поэтому проверяем это отдельно и говорим прямо.
 */
export function exceedsWorkday(ctx: ScheduleContext | null, durationMin: number) {
  if (!ctx) return false;
  return durationMin > longestWorkday(ctx);
}

/** Мастера, которые делают все выбранные процедуры */
export function mastersForItems<T extends { serviceIds: string[]; active: boolean }>(
  masters: T[],
  items: BookingItem[],
) {
  return masters.filter(
    (m) =>
      m.active &&
      items.every((i) => m.serviceIds.length === 0 || m.serviceIds.includes(i.serviceId)),
  );
}

/** Добавить, заменить вариант или убрать позицию — одной операцией */
export function toggleItem(items: BookingItem[], next: BookingItem): BookingItem[] {
  const existing = items.find((i) => i.serviceId === next.serviceId);

  if (!existing) {
    if (items.length >= MAX_ITEMS) return items;
    return [...items, next];
  }
  // повторный тап по тому же варианту — снять выбор
  if (existing.variantId === next.variantId) {
    return items.filter((i) => i.serviceId !== next.serviceId);
  }
  // другой вариант той же услуги — заменить, а не добавить второй
  return items.map((i) => (i.serviceId === next.serviceId ? next : i));
}

export function isSelected(items: BookingItem[], serviceId: string, variantId?: string) {
  return items.some(
    (i) => i.serviceId === serviceId && (variantId === undefined || i.variantId === variantId),
  );
}
