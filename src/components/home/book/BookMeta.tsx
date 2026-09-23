"use client";

import { useContext, useLayoutEffect } from "react";
import type { BookId } from "@/lib/book/books";
import { useBookStore } from "@/lib/book/bookStore";
import type { BookPageRef } from "@/lib/book/navigation";
import { BookCopyContext } from "./bookCopyContext";

// 각 쪽이 자기 책·쪽 키·순서표를 무대에 알린다 (렌더 결과 없음)
export function BookMeta({
  book,
  pageKey,
  manifest,
}: {
  book: BookId;
  pageKey: string;
  manifest: readonly BookPageRef[];
}) {
  const isCopy = useContext(BookCopyContext);
  const register = useBookStore((s) => s.register);
  useLayoutEffect(() => {
    if (!isCopy) register({ book, key: pageKey, manifest });
  }, [isCopy, register, book, pageKey, manifest]);
  return null;
}
