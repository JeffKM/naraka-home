"use client";

import Link from "next/link";
import { useBookStore } from "@/lib/book/bookStore";
import { tabRefs } from "@/lib/book/navigation";

// 데스크톱 전용 — 이 책 안의 쪽으로 바로 (먼 쪽은 무대가 후루룩으로 넘긴다)
export function IndexTabs() {
  const current = useBookStore((s) => s.current);
  if (!current) return null;
  const tabs = tabRefs(current.manifest);
  if (tabs.length < 2) return null;
  return (
    <nav aria-label="이 책의 쪽" className="book-tabs">
      {tabs.map((t) => (
        <Link
          key={t.key}
          href={t.href}
          scroll={false}
          aria-current={t.key === current.key ? "page" : undefined}
          className="book-tab"
        >
          {t.tab}
        </Link>
      ))}
    </nav>
  );
}
