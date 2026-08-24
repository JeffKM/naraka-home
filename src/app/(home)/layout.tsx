import { Gaegu, Gowun_Dodum, Hahmlet } from "next/font/google";
import Image from "next/image";
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
      <div className="relative flex-1">
        {/* 원화 장식 — xl 이상 본문 바깥 여백에만 표시 */}
        <div aria-hidden className="pointer-events-none absolute inset-0 z-10 hidden select-none xl:block">
          <div className="home-hang absolute left-[4vw] top-0">
            <Image src="/home/deco/hanging-tassel.webp" alt="" width={108} height={195} />
          </div>
          <Image
            src="/home/deco/wisp-a.webp"
            alt=""
            width={44}
            height={55}
            className="home-wisp-float absolute left-[calc(4vw+120px)] top-[150px]"
          />
          <Image
            src="/home/deco/wisp-b.webp"
            alt=""
            width={50}
            height={75}
            className="home-wisp-float absolute right-[4vw] top-[360px] [animation-delay:1.6s]"
          />
        </div>
        {children}
      </div>
      <HomeFooter />
    </div>
  );
}
