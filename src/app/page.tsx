import { Footer } from "@/blocks/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { StickyBookBar } from "@/components/layout/StickyBookBar";
import { pageBlocks } from "@/config/blocks";
import { AvailabilityProvider } from "@/features/booking/AvailabilityProvider";
import { BookingProvider } from "@/features/booking/BookingProvider";
import { BookingSheet } from "@/features/booking/BookingSheet";

/**
 * Страница ничего не верстает. Она только собирает блоки из конфига
 * и оборачивает их в состояние записи.
 */
export default function HomePage() {
  return (
    <AvailabilityProvider>
      <BookingProvider>
      <Navbar />

      <main>
        {pageBlocks
          .filter((b) => b.enabled)
          .map(({ id, Component }) => (
            <Component key={id} />
          ))}
      </main>

      <Footer />
      <StickyBookBar />
      <BookingSheet />
      </BookingProvider>
    </AvailabilityProvider>
  );
}
