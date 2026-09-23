"use client";

import { getBook } from "@/lib/book/books";
import { useBookStore } from "@/lib/book/bookStore";
import { indexOfKey } from "@/lib/book/navigation";

// 쪽이 바뀌면 스크린리더가 "요괴 책, 3쪽 / 7쪽"을 읽는다 (처음 내용은 읽히지 않고 바뀔 때만)
export function PageAnnouncer() {
  const current = useBookStore((s) => s.current);
  const i = current ? indexOfKey(current.manifest, current.key) : -1;
  const message =
    current && i !== -1 ? `${getBook(current.book).title} 책, ${i + 1}쪽 / ${current.manifest.length}쪽` : "";
  return (
    <p aria-live="polite" aria-atomic="true" className="sr-only">
      {message}
    </p>
  );
}
