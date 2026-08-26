"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type NavItem = { href: string; label: string };

// 카페 홈 내비 — 현재 페이지 표시 + 가로 스크롤 시 우측 페이드로 "더 있음"을 알린다.
// 좁은 화면에서 항목이 아무 신호 없이 잘리던 문제(디자인 감사 F-001·F-002) 대응.
export function HomeNav({ items }: { items: readonly NavItem[] }) {
  const pathname = usePathname();
  const ref = useRef<HTMLElement>(null);
  const [overflow, setOverflow] = useState(false);

  useEffect(() => {
    const nav = ref.current;
    if (!nav) return;
    const sync = () => setOverflow(nav.scrollWidth - nav.clientWidth > 1);
    sync();
    const observer = new ResizeObserver(sync);
    observer.observe(nav);
    return () => observer.disconnect();
  }, []);

  return (
    <nav
      ref={ref}
      data-overflow={overflow ? "true" : undefined}
      className="home-ui home-nav scrollbar-none flex gap-4 overflow-x-auto text-sm"
    >
      {items.map((item) => {
        const active =
          item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            data-active={active ? "true" : undefined}
            className="home-nav-link flex shrink-0 items-center"
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
