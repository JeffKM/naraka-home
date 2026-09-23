"use client";

import { useEffect, type ReactNode } from "react";
import { preloadArt } from "@/lib/book/art";
import { useBookStore } from "@/lib/book/bookStore";
import { useMediaQuery } from "@/lib/book/useMediaQuery";
import { ArtPicture } from "./ArtPlate";
import { BookStage } from "./BookStage";
import { IntroSequence } from "./IntroSequence";
import { PageAnnouncer } from "./PageAnnouncer";
import { ShelfDrawer } from "./ShelfDrawer";
import { TopBar } from "./TopBar";

// 레이아웃에 상주 — 이동해도 유지되므로 넘김·교체·인트로 연출을 여기서 쥔다
export function BookShell({ children }: { children: ReactNode }) {
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  // 책 교체·인트로 그림은 첫 화면이 자리 잡은 뒤 뒤에서 미리 받는다
  useEffect(() => {
    const t = window.setTimeout(preloadArt, 1500);
    return () => window.clearTimeout(t);
  }, []);
  // 책 밖(주식앱·어드민)으로 나가면 서랍·교체 요청을 비운다 — 돌아왔을 때 서랍이 열려 있거나 연출이 멈춰 있지 않게
  useEffect(() => () => useBookStore.getState().resetUi(), []);
  return (
    <div className="book-shell">
      <div className="book-desk" aria-hidden>
        <ArtPicture desktop="desk" mobile="desk-m" className="book-desk-art" />
      </div>
      <TopBar />
      <ShelfDrawer />
      <BookStage reducedMotion={reducedMotion}>{children}</BookStage>
      <PageAnnouncer />
      <IntroSequence reducedMotion={reducedMotion} />
    </div>
  );
}
