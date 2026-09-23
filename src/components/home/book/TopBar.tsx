"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useBookStore } from "@/lib/book/bookStore";
import { HOME_INFO } from "@/lib/homeConfig";

export function TopBar() {
  const open = useBookStore((s) => s.drawerOpen);
  const setOpen = useBookStore((s) => s.setDrawerOpen);
  return (
    <header className="book-topbar">
      <Link href="/" scroll={false} className="book-logo home-serif">
        {HOME_INFO.name}
      </Link>
      <div className="flex items-center gap-2">
        <a
          href={HOME_INFO.reserveUrl}
          target="_blank"
          rel="noreferrer"
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
