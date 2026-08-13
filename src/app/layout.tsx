import type { Metadata, Viewport } from "next";
import { Inter, Cormorant_Garamond, Manrope, Fraunces } from "next/font/google";
import { site } from "@/config/site";
import { ALLOW_THEME_QUERY, THEME, themeNames } from "@/config/theme";
import "./globals.css";
import { CookieBanner } from "@/components/ui/CookieBanner";

const body = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-body",
  display: "swap",
});

/**
 * По шрифту на тему.
 *
 * preload: false у всех трёх — и это не оплошность. next/font требует
 * литералов, вычислить активную тему на этапе сборки он не даст,
 * а три preload-ссылки в <head> заставили бы браузер тянуть все шрифты,
 * включая два неиспользуемых. Без preload лишние @font-face остаются
 * лежать мёртвым CSS: браузер скачивает шрифт только когда его семейство
 * реально применено к элементу на странице.
 */
const couture = Cormorant_Garamond({
  subsets: ["latin", "cyrillic"],
  weight: ["300", "400", "500"],
  variable: "--font-couture",
  display: "swap",
  preload: false,
});

const noir = Manrope({
  subsets: ["latin", "cyrillic"],
  weight: ["500", "600", "700"],
  variable: "--font-noir",
  display: "swap",
  preload: false,
});

const bloom = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-bloom",
  display: "swap",
  preload: false,
});

const fontVars = [body.variable, couture.variable, noir.variable, bloom.variable].join(" ");

/**
 * Демонстрация клиенту без пересборки: ?theme=bloom в адресе.
 * Скрипт ставит атрибут до отрисовки, поэтому мигания темы нет.
 * Список тем зашит здесь же — чужое значение из адреса не применится.
 */
const themeQueryScript = `(function(){try{var t=new URLSearchParams(location.search).get("theme");if(t&&${JSON.stringify(
  themeNames,
)}.indexOf(t)>-1){document.documentElement.setAttribute("data-theme",t)}}catch(e){}})()`;

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
  // Цвет строки браузера под тему — иначе на noir сверху белая полоса
  themeColor:
    THEME === "noir"
      ? "#0b0b0c"
      : THEME === "bloom"
        ? "#fffafa"
        : THEME === "cupertino"
          ? "#fbfbfd"
          : "#fdfcfa",
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
    <html lang="ru" data-theme={THEME} className={fontVars}>
      <body>
        {ALLOW_THEME_QUERY && (
          <script dangerouslySetInnerHTML={{ __html: themeQueryScript }} />
        )}

        {children}

        {/* 👈 2. Add CookieBanner here */}
        <CookieBanner />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </body>
    </html>
  );
}
