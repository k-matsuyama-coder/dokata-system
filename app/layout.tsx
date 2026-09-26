import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import NavBar from "./components/NavBar";
import { Toaster } from "react-hot-toast";
import { LanguageProvider } from "@/app/providers/LanguageProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DOBIX SYSTEM",
  description: "番割・日報・シフト管理システム",
  manifest: "/manifest.json",
  icons: {
    icon: [
      {
        url: "/dobix-favicon-v2.png",
        sizes: "32x32",
        type: "image/png",
      },
    ],
    apple: [
      {
        url: "/dobix-apple-icon-v2.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
  appleWebApp: {
    capable: true,
    title: "DOBIX SYSTEM",
    statusBarStyle: "default",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <LanguageProvider>
          <NavBar />
          <main style={{ padding: "76px 16px 16px" }}>{children}</main>
          <Toaster position="top-center" />
        </LanguageProvider>
      </body>
    </html>
  );
}