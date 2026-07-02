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
  title: "DOKATA-System",
  description: "番割・日報・シフト管理システム",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "DOKATA-System",
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