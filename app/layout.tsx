import type { Metadata } from "next";
import { Toaster } from "react-hot-toast";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "leaflet/dist/leaflet.css";
import Script from "next/script";
import BottomNav from "./components/BottomNav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  verification: {
    google: "KCei6hPQju0fr9CXe_Dktpitcsm6Jn0CZpEJgoxOTRo",
  },
  title: "FoodRec | 友達のグルメをRecordしてRecommend",
  description: "友達がどこで何を食べたか一目でわかるグルメSNS。お気に入りの店をいいね・保存して、友達におすすめしよう。",
  manifest: "/manifest.json",
  icons: {
    apple: "/icon-192.png",
  },
  openGraph: {
    title: "FoodRec | 友達のグルメをRecordしてRecommend",
    description: "友達がどこで何を食べたか一目でわかるグルメSNS。お気に入りの店をいいね・保存して、友達におすすめしよう。",
    url: "https://food-rec-rouge.vercel.app",
    siteName: "FoodRec",
    locale: "ja_JP",
    type: "website",
    images: [
      {
        url: "https://food-rec-rouge.vercel.app/og-image.png",
        width: 1200,
        height: 630,
        alt: "FoodRec - 友達のおすすめだけで選ぶ",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "FoodRec | 友達のグルメをRecordしてRecommend",
    description: "友達がどこで何を食べたか一目でわかるグルメSNS。",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        style={{ backgroundColor: "fafafa" }}
      ><Script
    src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`}
    strategy="beforeInteractive"
  />
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-T3YB8GF6KE"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-T3YB8GF6KE');
          `}
        </Script>
        {children}
        <BottomNav />
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
