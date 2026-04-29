import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ServiceWorkerRegistration from "./components/ServiceWorkerRegistration";
import InstallPrompt from "./components/InstallPrompt";
import IOSInstallBanner from "./components/IOSInstallBanner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#1D9E75",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://aibotbanao.com"),
  title: "AIBotBanao — Free AI Chatbot for Your Shop",
  description:
    "Create a free AI chatbot for your business in 5 minutes. Works in Urdu and English. Share on WhatsApp, Instagram, and Facebook.",
  manifest: "/manifest.json",
  applicationName: "AIBotBanao",
  formatDetection: { telephone: false },
  appleWebApp: {
    capable: true,
    title: "AIBotBanao",
    statusBarStyle: "default",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    url: "https://aibotbanao.com",
    siteName: "AIBotBanao",
  },
  icons: {
    icon: [{ url: "/favicon.ico" }],
    shortcut: "/favicon.ico",
    apple: "/newlogo.png",
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
      <body className="min-h-full flex flex-col">
        {children}
        <ServiceWorkerRegistration />
        <InstallPrompt />
        <IOSInstallBanner />
      </body>
    </html>
  );
}
