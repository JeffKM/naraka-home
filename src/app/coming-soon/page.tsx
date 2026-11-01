import type { Metadata } from "next";
import { HOME_INFO } from "@/lib/homeConfig";

// 카페 홈 잠금 화면 — 홈이 개발 중인 동안 방문자는 모든 홈 주소에서 이 화면을 본다(src/proxy.ts).
// 색인은 막는다(준비 중 문구가 검색 결과에 남지 않게).
export const metadata: Metadata = {
  title: "준비 중",
  robots: { index: false, follow: false },
};

export default function ComingSoonPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-16 text-center">
      <h1 className="text-2xl font-bold">{HOME_INFO.name} 홈페이지를 준비하고 있어요</h1>
      <p className="max-w-sm text-muted-foreground">
        아직 개발 중이에요. 영업 소식과 예약은 아래에서 확인해 주세요.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <a
          href={HOME_INFO.reserveUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          네이버 예약
        </a>
        <a
          href={HOME_INFO.instagramUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-md border px-4 py-2 text-sm font-medium"
        >
          인스타그램 @{HOME_INFO.instagramHandle}
        </a>
      </div>
    </main>
  );
}
