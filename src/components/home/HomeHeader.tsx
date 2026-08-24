import Link from "next/link";
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
    <header className="sticky top-0 z-40 border-b border-[var(--home-line)] bg-[var(--home-surface)]/95 backdrop-blur">
      <div className="mx-auto flex max-w-3xl items-center gap-4 px-4 py-3">
        <Link href="/" className="shrink-0 text-lg font-bold tracking-widest">
          {HOME_INFO.name}
        </Link>
        <nav className="scrollbar-none flex gap-4 overflow-x-auto text-sm">
          {HOME_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="shrink-0 py-1 hover:text-[var(--home-burgundy)]"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
