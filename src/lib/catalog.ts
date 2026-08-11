import type { Service } from "@/types";

export function getService(services: Service[], id: string | null | undefined): Service | null {
  if (!id) return null;
  return services.find((s) => s.id === id) ?? null;
}

export function getVariant(service: Service | null, variantId: string) {
  return service?.variants.find((v) => v.id === variantId) ?? null;
}

export function minPrice(service: Service): number {
  if (!service.variants.length) return 0;
  return Math.min(...service.variants.map((v) => v.price));
}

export function defaultVariant(service: Service) {
  return service.variants[Math.min(1, service.variants.length - 1)];
}
