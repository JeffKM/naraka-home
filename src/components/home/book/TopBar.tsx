"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useBookStore } from "@/lib/book/bookStore";
import { HOME_INFO } from "@/lib/homeConfig";

export function TopBar() {
  const open = useBookStore((s) => s.drawerOpen);
  const setOpen = useBookStore((s) => s.setDrawerOpen);
  // 인트로 재생 중엔 상단 바 전체(로고·예약·서랍 토글)를 inert 처리 — Tab·클릭으로 못 닿게
  const introActive = useBookStore((s) => s.introActive);
  return (
    <header className="book-topbar" inert={introActive}>
      {/* 서랍(모달)이 열리면 서랍 밖 링크는 Tab으로 닿지 않게 — 닫기 토글만 남긴다 */}
      <Link href="/" scroll={false} inert={open} className="book-logo home-serif">
        {HOME_INFO.name}
      </Link>
      <div className="flex items-center gap-2">
        <a
          href={HOME_INFO.reserveUrl}
          target="_blank"
          rel="noreferrer"
          inert={open}
          className="home-btn home-btn-primary inline-flex min-h-11 items-center px-4 text-sm"
        >
          예약하기
        </a>
        <button
          type="button"
          className="book-icon-btn"
          aria-label={open ? "책장 닫기" : "책장 열기"}
          aria-expanded={open}
          aria-controls="book-shelf-drawer"
          onClick={() => setOpen(!open)}
        >
          {open ? <X aria-hidden className="size-5" /> : <Menu aria-hidden className="size-5" />}
        </button>
      </div>
    </header>
  );
}
