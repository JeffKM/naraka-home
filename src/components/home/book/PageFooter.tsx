"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useBookStore } from "@/lib/book/bookStore";
import type { FlipDir } from "@/lib/book/input";
import { indexOfKey } from "@/lib/book/navigation";

// 모바일 전용 — "3 / 7" · 이전 · 다음 · 목차
export function PageFooter({ onGo }: { onGo: (dir: FlipDir) => void }) {
  const current = useBookStore((s) => s.current);
  if (!current) return null;
  const i = indexOfKey(current.manifest, current.key);
  if (i === -1) return null;
  const n = current.manifest.length;
  return (
    <nav aria-label="쪽 이동" className="book-footer">
      <button type="button" className="book-icon-btn" aria-label="이전 쪽" disabled={i === 0} onClick={() => onGo(-1)}>
        <ChevronLeft aria-hidden className="size-5" />
      </button>
      <span className="text-sm tabular-nums">
        {i + 1} / {n}
      </span>
      <button type="button" className="book-icon-btn" aria-label="다음 쪽" disabled={i === n - 1} onClick={() => onGo(1)}>
        <ChevronRight aria-hidden className="size-5" />
      </button>
      {i !== 0 && (
        <Link href={current.manifest[0].href} scroll={false} className="book-footer-toc">
          목차
        </Link>
      )}
    </nav>
  );
}
