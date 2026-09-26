import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "./marketplace.css";
import "./seo-catalog.css";
import { LanguageProvider } from "./components/LanguageProvider";
import { WebAuthProvider } from "./components/WebAuthProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://jetkiz.asia"),
  title: {
    default: "JETKIZ — доставка еды в Щучинске",
    template: "%s | JETKIZ",
  },
  description:
    "Доставка еды в Щучинске. Рестораны города, актуальные меню и цены, заказ онлайн и оплата картой через JETKIZ.",
  applicationName: "JETKIZ",
  keywords: [
    "доставка еды Щучинск",
    "заказать еду Щучинск",
    "рестораны Щучинск",
    "JETKIZ",
    "доставка Бурабай",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "ru_KZ",
    siteName: "JETKIZ",
    title: "JETKIZ — доставка еды в Щучинске",
    description:
      "Рестораны Щучинска, актуальные меню и цены. Заказ еды онлайн с доставкой или самовывозом.",
    url: "https://jetkiz.asia/",
  },
  themeColor: "#ffffff",
  icons: {
    icon: [
      { url: "/favicon.png", type: "image/png", sizes: "96x96" },
      { url: "/jetkiz-icon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/favicon.png",
    apple: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <LanguageProvider>
          <WebAuthProvider>{children}</WebAuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
