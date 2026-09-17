import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Farmly — The Digital Infrastructure for Modern Farming",
  description:
    "Farmly connects farmers, buyers, and agricultural services through a simple digital infrastructure built for modern farming.",
  applicationName: "Farmly",
  keywords: [
    "Farmly",
    "Agriculture",
    "Digital Farming",
    "Farmer Identity",
    "Crop Management",
    "Livestock",
    "Dairy",
    "Agricultural Marketplace",
  ],
  authors: [{ name: "Farmly Ecosystem" }],
  creator: "Farmly",
  openGraph: {
    title: "Farmly — The Digital Infrastructure for Modern Farming",
    description:
      "One Digital Platform for Every Farm. Connecting growers, buyers, and services.",
    siteName: "Farmly",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: "#050806",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-farmly-bg text-white font-sans antialiased selection:bg-farmly-primary selection:text-white">
        {children}
      </body>
    </html>
  );
}
