"use client";

import { useEffect, type ReactNode } from "react";
import { preloadArt } from "@/lib/book/art";
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
