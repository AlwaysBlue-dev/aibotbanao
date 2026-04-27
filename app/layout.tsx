import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://aibotbanao.com"),
  title: "AIBotBanao — Free AI Chatbot for Your Shop",
  description:
    "Create a free AI chatbot for your business in 5 minutes. Works in Urdu and English. Share on WhatsApp, Instagram, and Facebook.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    url: "https://aibotbanao.com",
    siteName: "AIBotBanao",
  },
  icons: {
    icon: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
