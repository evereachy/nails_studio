import { Suspense } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { StickyBookBar } from "@/components/layout/StickyBookBar";

import { Hero } from "@/features/landing/Hero";
import { About } from "@/features/landing/About";
import { Services } from "@/features/landing/Services";
import { Gallery } from "@/features/landing/Gallery";
import { Reviews } from "@/features/landing/Reviews";
import { Booking } from "@/features/landing/Booking";
import { Faq } from "@/features/landing/Faq";

import { BookingSheet } from "@/features/booking/components/BookingSheet";
import { AvailabilityInitializer } from "@/features/booking/components/AvailabilityInitializer";

export default function HomePage() {
  return (
    <>
      <AvailabilityInitializer />
      <Header />
      <main>
        <Hero />
        <About />
        <Services />
        <Gallery />
        <Reviews />
        <Booking />
        <Faq />
      </main>
      <Footer />
      <StickyBookBar />
      <Suspense fallback={null}>
        <BookingSheet />
      </Suspense>
    </>
  );
}
