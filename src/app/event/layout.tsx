import type { Metadata } from "next";
import { BottomNav } from "@/components/layout/BottomNav";
import { FetchIndicator } from "@/components/layout/FetchIndicator";
import { Header } from "@/components/layout/Header";
import { HoldingAlertWatcher } from "@/components/layout/HoldingAlertWatcher";
import { MarketGridBackdrop } from "@/components/layout/MarketGridBackdrop";
import { MarketHaltBanner } from "@/components/quotes/MarketHaltBanner";

const OG_DESCRIPTION =
  "요괴 컨셉카페 나라카의 8월 이벤트 — 가상 화폐로 즐기는 모의 주식 거래";

export const metadata: Metadata = {
  title: {
    default: "나라카증권",
    template: "나라카증권 | %s",
  },
  description: OG_DESCRIPTION,
  openGraph: {
    type: "website",
    siteName: "나라카증권",
    title: "나라카증권",
    description: OG_DESCRIPTION,
    url: "/event",
    locale: "ko_KR",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "나라카증권" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "나라카증권",
    description: OG_DESCRIPTION,
    images: ["/og.png"],
  },
};

// 나라카증권(주식 이벤트) 구역 크롬 — 기존 루트 레이아웃에서 그대로 이동
export default function EventLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <MarketGridBackdrop />
      <FetchIndicator />
      <HoldingAlertWatcher />
      <Header />
      <MarketHaltBanner />
      <main className="mx-auto w-full max-w-lg flex-1 px-4 pb-24 pt-4">
        {children}
      </main>
      <BottomNav />
    </>
  );
}
