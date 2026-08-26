import Link from "next/link";
import { HomeNav } from "@/components/home/HomeNav";
import { HOME_INFO } from "@/lib/homeConfig";

const HOME_NAV = [
  { href: "/", label: "홈" },
  { href: "/about", label: "소개" },
  { href: "/location", label: "오시는 길" },
  { href: "/menu", label: "메뉴" },
  { href: "/staff", label: "스태프" },
  { href: "/notice", label: "공지" },
  { href: "/events", label: "이벤트" },
  { href: "/games", label: "게임" },
] as const;

// 카페 홈 고정 헤더 — 어느 페이지에서든 모든 탭 1클릭 (스크럽 여정 UX 안전장치)
export function HomeHeader() {
  return (
    <header className="home-chrome sticky top-0 z-40 border-b">
      <div className="mx-auto flex max-w-3xl items-center gap-4 px-4 py-1.5">
        <Link href="/" className="home-serif flex min-h-11 shrink-0 items-center text-xl font-extrabold text-[var(--home-chalk)]">
          {HOME_INFO.name}
          <span className="text-[var(--home-heart)]">.</span>
        </Link>
        <HomeNav items={HOME_NAV} />
        <a
          href={HOME_INFO.reserveUrl}
          target="_blank"
          rel="noreferrer"
          className="home-btn home-btn-primary ml-auto hidden min-h-11 shrink-0 items-center px-3 text-sm sm:flex"
        >
          예약하기
        </a>
      </div>
    </header>
  );
}
