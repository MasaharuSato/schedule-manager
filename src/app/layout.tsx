import type { Metadata, Viewport } from "next";
import { Noto_Serif_JP } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/BottomNav";

const notoSerifJP = Noto_Serif_JP({
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#121212",
};

export const metadata: Metadata = {
  title: "Schedule Manager",
  description: "タスク管理・1日のスケジュール作成ツール",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Schedule",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={`antialiased ${notoSerifJP.className}`}>
        <main className="mx-auto min-h-dvh max-w-md safe-bottom">
          {children}
        </main>
        <BottomNav />
      </body>
    </html>
  );
}
