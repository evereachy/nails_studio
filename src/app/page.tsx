import { Suspense } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { StickyBookBar } from "@/components/layout/StickyBookBar";
import { pageBlocks } from "@/config/blocks";
import { AvailabilityInitializer } from "@/features/booking/components/AvailabilityInitializer";
import { BookingSheet } from "@/features/booking/components/BookingSheet";

export default function HomePage() {
  return (
    <>
      <AvailabilityInitializer />
      <Header />
      <main className="relative z-0">
        {pageBlocks
          .filter((b) => b.enabled)
          .map(({ id, Component }) => (
            <Component key={id} />
          ))}
      </main>
      <Footer />
      <StickyBookBar />
      <Suspense fallback={null}>
        <BookingSheet />
      </Suspense>
    </>
  );
}
