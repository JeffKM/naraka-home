import type { Metadata } from "next";
import { Gowun_Dodum, Hahmlet } from "next/font/google";
import "../../(home)/home.css";
import "../../(home)/book.css";
import "./lab.css";
import { BookDepthLab } from "./BookDepthLab";

// 시험판 — 책 입체(D) + 책상 2.5D 겹(B). 메뉴·사이트맵에 연결하지 않고 검색에서도 뺀다
export const metadata: Metadata = {
  title: "입체 시험판",
  robots: { index: false, follow: false },
};

const hahmlet = Hahmlet({ subsets: ["latin"], weight: ["400", "800"], variable: "--font-hahmlet", preload: false });
const gowunDodum = Gowun_Dodum({ subsets: ["latin"], weight: "400", variable: "--font-gowun", preload: false });

export default function BookDepthLabPage() {
  return (
    <div className={`${hahmlet.variable} ${gowunDodum.variable} home-scope`}>
      <BookDepthLab />
    </div>
  );
}
