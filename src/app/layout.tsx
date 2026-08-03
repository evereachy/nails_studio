import type { Metadata, Viewport } from "next";
import { Inter, Cormorant_Garamond } from "next/font/google";
import { site } from "@/config/site";
import "./globals.css";

const body = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-body",
  display: "swap",
});

const display = Cormorant_Garamond({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: site.seo.title,
  description: site.seo.description,
  openGraph: {
    title: site.seo.title,
    description: site.seo.description,
    type: "website",
    locale: "ru_RU",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
  // maximumScale НЕ ограничиваем — иначе ломаем зум для слабовидящих
  viewportFit: "cover",
};

/** Структурированные данные — Google показывает часы работы и рейтинг прямо в выдаче. */
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "BeautySalon",
  name: site.name,
  description: site.seo.description,
  telephone: site.contacts.phone,
  email: site.contacts.email,
  address: { "@type": "PostalAddress", streetAddress: site.contacts.address, addressLocality: site.city },
  openingHours: ["Mo-Fr 09:00-20:00", "Sa-Su 10:00-18:00"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // data-theme переключает пресет оформления: "sand" | "noir" | "rose"
    <html lang="ru" data-theme="noir" className={`${body.variable} ${display.variable}`}>
      <body>
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </body>
    </html>
  );
}
