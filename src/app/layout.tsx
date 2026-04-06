import type { Metadata, Viewport } from "next";
import { Inter, DM_Sans } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
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
  themeColor: "#FFFFFF",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <body className={`${inter.variable} ${dmSans.variable} font-sans min-h-screen antialiased bg-background text-foreground`} suppressHydrationWarning>
        <div className="flex flex-col min-h-screen">
          <Navbar />
          <main className="flex-1 page-transition relative">
            {children}
          </main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
