import "./home.css";
import { HomeFooter } from "@/components/home/HomeFooter";
import { HomeHeader } from "@/components/home/HomeHeader";

// 카페 홈 구역 크롬 — 앤틱 레트로 팔레트는 .home-scope로 스코프 (주식앱 테마와 독립)
export default function HomeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="home-scope flex min-h-dvh flex-col">
      <HomeHeader />
      <div className="flex-1">{children}</div>
      <HomeFooter />
    </div>
  );
}
