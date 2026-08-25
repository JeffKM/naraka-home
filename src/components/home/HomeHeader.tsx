import Link from "next/link";
import { HOME_INFO } from "@/lib/homeConfig";

const HOME_NAV = [
  { href: "/", label: "홈" },
  { href: "/about", label: "소개" },
  { href: "/story", label: "설화" },
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
    <header className="home-chrome sticky top-0 z-40 border-b-2 border-[var(--home-rosewood)]">
      <div className="mx-auto flex max-w-3xl items-center gap-4 px-4 py-3">
        <Link href="/" className="home-serif shrink-0 text-xl font-extrabold text-[var(--home-chalk)]">
          {HOME_INFO.name}
          <span className="text-[var(--home-wisp)]">.</span>
        </Link>
        <nav className="home-ui scrollbar-none flex gap-4 overflow-x-auto text-sm">
          {HOME_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="shrink-0 py-1 hover:text-[var(--home-chalk)]"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <a
          href={HOME_INFO.reserveUrl}
          target="_blank"
          rel="noreferrer"
          className="home-btn home-btn-primary ml-auto hidden shrink-0 px-3 py-1 text-sm sm:inline-block"
        >
          예약하기
        </a>
      </div>
    </header>
  );
}
