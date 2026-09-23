import { Suspense } from "react";
import { Gaegu, Gowun_Dodum, Hahmlet } from "next/font/google";
import "./home.css";
import "./book.css";
import { BookShell } from "@/components/home/book/BookShell";

// 카페 홈 전용 서체 3종 — 위계: Hahmlet(제목·UI 세리프) → Gowun Dodum(본문) → Gaegu(손글씨)
// 한글 서체는 글자 범위별 조각이 수십 개라 전부 preload하면 모바일 첫 화면(LCP)을 수 초 늦춘다 →
// preload는 끄고, 쓰는 글자의 조각만 unicode-range로 받게 둔다 (display: swap이라 글은 대체 서체로 먼저 보인다)
const hahmlet = Hahmlet({
  subsets: ["latin"],
  weight: ["400", "600", "800"],
  variable: "--font-hahmlet",
  preload: false,
});
const gowunDodum = Gowun_Dodum({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-gowun",
  preload: false,
});
const gaegu = Gaegu({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-gaegu",
  preload: false,
});

// 카페 홈 = 책 8권. 화면 고정, 쪽 이동은 BookShell이 연출한다
export default function HomeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`${hahmlet.variable} ${gowunDodum.variable} ${gaegu.variable} home-scope book-root`}
    >
      {/* useSearchParams 경계 — 대체 화면에도 쪽 내용을 그대로 싣는다 */}
      <Suspense fallback={<main className="book-fallback">{children}</main>}>
        <BookShell>{children}</BookShell>
      </Suspense>
    </div>
  );
}
