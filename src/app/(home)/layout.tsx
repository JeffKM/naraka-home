import { Gaegu, Gowun_Dodum, Hahmlet, Jua } from "next/font/google";
import "./home.css";
import { HomeFooter } from "@/components/home/HomeFooter";
import { HomeHeader } from "@/components/home/HomeHeader";

// 카페 홈 전용 서체 4종 — 위계: Hahmlet(제목) → Jua(UI) → Gowun Dodum(본문) → Gaegu(장식)
const hahmlet = Hahmlet({
  subsets: ["latin"],
  weight: ["400", "600", "800"],
  variable: "--font-hahmlet",
});
const jua = Jua({ subsets: ["latin"], weight: "400", variable: "--font-jua" });
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

// 카페 홈 구역 크롬 — "종이 위의 요괴들" 팔레트는 .home-scope로 스코프 (주식앱 테마와 독립)
export default function HomeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`${hahmlet.variable} ${jua.variable} ${gowunDodum.variable} ${gaegu.variable} home-scope flex min-h-dvh flex-col`}
    >
      <div className="home-curtain" aria-hidden />
      <HomeHeader />
      <div className="flex-1">{children}</div>
      <HomeFooter />
    </div>
  );
}
