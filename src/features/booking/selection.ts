import { longestWorkday } from "@/features/availability/slots";
import { getService, getVariant } from "@/lib/catalog";
import type {
  BookingItem,
  BookingLine,
  ResolvedItem,
  ScheduleContext,
  SelectionSummary,
  Service,
} from "@/types";

/** Maximum allowed service items per single visit */
export const MAX_ITEMS = 4;

/**
 * Resolves selected booking items to full service/variant records and computes totals.
 * Shared between client UI calculation and server payload validation.
 */
export function summarize(items: BookingItem[], services: Service[] = []): SelectionSummary {
  const resolved: ResolvedItem[] = [];

  for (const item of items) {
    const service = getService(services, item.serviceId);
    const variant = getVariant(service, item.variantId);
    if (service && variant) {
      resolved.push({ service, variant });
    }
  }

  return {
    items: resolved,
    durationMin: resolved.reduce((sum, r) => sum + r.variant.durationMin, 0),
    price: resolved.reduce((sum, r) => sum + r.variant.price, 0),
    currency: resolved[0]?.service.currency ?? "Kč",
  };
}

/** Flattened service line representation for API payloads and messaging channels */
export function toLines(items: BookingItem[], services: Service[] = []): BookingLine[] {
  return summarize(items, services).items.map(({ service, variant }) => ({
    serviceId: service.id,
    variantId: variant.id,
    serviceTitle: service.title,
    variantLabel: variant.label,
    durationMin: variant.durationMin,
    price: variant.price,
  }));
}

/**
 * Checks if total booking duration exceeds the longest available operational shift.
 */
export function exceedsWorkday(ctx: ScheduleContext | null, durationMin: number): boolean {
  if (!ctx) return false;
  return durationMin > longestWorkday(ctx);
}

/** Filters active masters capable of performing all selected services */
export function mastersForItems<T extends { serviceIds: string[]; active: boolean }>(
  masters: T[],
  items: BookingItem[],
): T[] {
  return masters.filter(
    (m) =>
      m.active &&
      items.every((i) => m.serviceIds.length === 0 || m.serviceIds.includes(i.serviceId)),
  );
}

/** Adds, toggles, or replaces a variant selection in place */
export function toggleItem(items: BookingItem[], next: BookingItem): BookingItem[] {
  const existing = items.find((i) => i.serviceId === next.serviceId);

  if (!existing) {
    if (items.length >= MAX_ITEMS) return items;
    return [...items, next];
  }

  // Tapping identical variant removes it
  if (existing.variantId === next.variantId) {
    return items.filter((i) => i.serviceId !== next.serviceId);
  }

  // Tapping alternate variant for existing service replaces it
  return items.map((i) => (i.serviceId === next.serviceId ? next : i));
}

export function isSelected(
  items: BookingItem[],
  serviceId: string,
  variantId?: string,
): boolean {
  return items.some(
    (i) => i.serviceId === serviceId && (variantId === undefined || i.variantId === variantId),
  );
}
