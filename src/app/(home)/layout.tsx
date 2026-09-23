import { Gaegu, Gowun_Dodum, Hahmlet } from "next/font/google";
import "./home.css";
import { HomeFooter } from "@/components/home/HomeFooter";
import { HomeHeader } from "@/components/home/HomeHeader";

// 카페 홈 전용 서체 3종 — 위계: Hahmlet(제목·UI 세리프) → Gowun Dodum(본문) → Gaegu(손글씨)
const hahmlet = Hahmlet({
  subsets: ["latin"],
  weight: ["400", "600", "800"],
  variable: "--font-hahmlet",
});
const gowunDodum = Gowun_Dodum({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-gowun",
});
const gaegu = Gaegu({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-gaegu",
});

// 카페 홈 구역 크롬 — "나라카 앤틱" 팔레트는 .home-scope로 스코프 (주식앱 테마와 독립)
export default function HomeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`${hahmlet.variable} ${gowunDodum.variable} ${gaegu.variable} home-scope flex min-h-dvh flex-col`}
    >
      <div className="home-curtain" aria-hidden />
      <HomeHeader />
      {/* overflow-clip: 절대배치 장식이 짧은 페이지에서 푸터 아래로 넘쳐 흰 배경을 드러내는 것 방지 */}
      <div className="relative flex-1 overflow-clip">
        {children}
      </div>
      <HomeFooter />
    </div>
  );
}
