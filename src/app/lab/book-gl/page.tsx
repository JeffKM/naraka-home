import type { Metadata } from "next";
import { Gowun_Dodum, Hahmlet } from "next/font/google";
import "../../(home)/home.css";
import "../book-depth/lab.css";
import { BookGLLab } from "./BookGLLab";

// 시험판 2 — WebGL 3D 책. 메뉴·사이트맵에 연결하지 않고 검색에서도 뺀다
export const metadata: Metadata = {
  title: "3D 책 시험판",
  robots: { index: false, follow: false },
};

const hahmlet = Hahmlet({ subsets: ["latin"], weight: ["400", "800"], variable: "--font-hahmlet", preload: false });
const gowunDodum = Gowun_Dodum({ subsets: ["latin"], weight: "400", variable: "--font-gowun", preload: false });

export default function BookGLLabPage() {
  return (
    <div className={`${hahmlet.variable} ${gowunDodum.variable} home-scope`}>
      <BookGLLab />
    </div>
  );
}
