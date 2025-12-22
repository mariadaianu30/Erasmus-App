import type { Metadata, Viewport } from "next";
import { Inter_Tight } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const interTight = Inter_Tight({
  subsets: ["latin"],
  variable: "--font-inter-tight",
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "Erasmus+ Connect",
  description: "Erasmus+ Connect by Scout Society - Connect with verified events, discover experiences, and manage applications with ease.",
  keywords: ["erasmus+", "scout society", "events", "community", "networking", "participants", "organizations", "verified events"],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#3b82f6",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full scroll-smooth" suppressHydrationWarning>
      <body className={`${interTight.variable} font-sans h-full antialiased`} suppressHydrationWarning>
        <div className="min-h-full flex flex-col">
          <Navbar />
          <main className="flex-1 page-transition">
            {children}
          </main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
