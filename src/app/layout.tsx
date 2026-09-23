import type { Metadata, Viewport } from "next";
import { Geist_Mono, Noto_Sans_KR } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { Toaster } from "@/components/ui/sonner";

const notoSansKr = Noto_Sans_KR({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const OG_DESCRIPTION = "대구 동성로 요괴 컨셉카페 나라카 — 요괴들의 도시에 오신 것을 환영합니다";

export const metadata: Metadata = {
  metadataBase: new URL("https://naraka.cafe"),
  title: {
    default: "나라카",
    template: "나라카 | %s",
  },
  description: OG_DESCRIPTION,
  openGraph: {
    type: "website",
    siteName: "나라카",
    title: "나라카",
    description: OG_DESCRIPTION,
    url: "/",
    locale: "ko_KR",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "나라카" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "나라카",
    description: OG_DESCRIPTION,
    images: ["/og.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#1d1726",
};

// 공통 셸 — 폰트·전역 프로바이더·토스터만. 페이지 크롬은 각 구역 레이아웃이 담당한다.
// (event = 나라카증권 크롬, (home) = 카페 홈 크롬, admin = 콘솔)
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      suppressHydrationWarning
      className={`${notoSansKr.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-dvh flex-col">
        <Providers>
          {children}
          <Toaster position="top-center" />
        </Providers>
      </body>
    </html>
  );
}
