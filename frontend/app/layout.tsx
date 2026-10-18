import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/contexts/theme-context";
import { LanguageProvider } from "@/contexts/language-context";
import { MockDataProvider } from "@/contexts/mock-data-context";
import { AuthProvider } from "@/contexts/auth-context";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
  variable: "--font-poppins",
  preload: true,
});

export const metadata: Metadata = {
  title: "Farmly — Digital Infrastructure for Modern Farming",
  description:
    "Farmly connects farmers, buyers, and agricultural services through a simple digital infrastructure built for modern farming.",
  applicationName: "Farmly",
  keywords: ["Farmly", "Agriculture", "Digital Farming", "Farmer Identity", "Crop Management"],
  authors: [{ name: "Farmly" }],
  creator: "Farmly",
  openGraph: {
    title: "Farmly — Digital Infrastructure for Modern Farming",
    description: "One platform for every farm.",
    siteName: "Farmly",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#fff6e8",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={poppins.variable}>
      <body className="min-h-screen bg-farmly-bg text-farmly-foreground font-sans antialiased">
        <ThemeProvider>
          <LanguageProvider>
            <MockDataProvider>
              <AuthProvider>{children}</AuthProvider>
            </MockDataProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
