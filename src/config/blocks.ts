import { About } from "@/features/landing/About";
import { Booking } from "@/features/landing/Booking";
import { Faq } from "@/features/landing/Faq";
import { Gallery } from "@/features/landing/Gallery";
import { Hero } from "@/features/landing/Hero";
import { Reviews } from "@/features/landing/Reviews";
import { Services } from "@/features/landing/Services";
import type { ComponentType } from "react";

export type BlockId = "hero" | "about" | "services" | "booking" | "reviews" | "gallery" | "faq";

export interface BlockConfig {
  id: BlockId;
  Component: ComponentType;
  enabled: boolean;
}

export const pageBlocks: BlockConfig[] = [
  { id: "hero", Component: Hero, enabled: false },
  { id: "about", Component: About, enabled: true },
  { id: "services", Component: Services, enabled: true },
  { id: "booking", Component: Booking, enabled: true },
  { id: "reviews", Component: Reviews, enabled: true },
  { id: "gallery", Component: Gallery, enabled: true },
  { id: "faq", Component: Faq, enabled: true },
];;
