"use client";

import type { ReactNode } from "react";
import { useMediaQuery } from "@/lib/book/useMediaQuery";
import { ArtPlate } from "./ArtPlate";
import { BookStage } from "./BookStage";
import { IntroSequence } from "./IntroSequence";
import { PageAnnouncer } from "./PageAnnouncer";
import { ShelfDrawer } from "./ShelfDrawer";
import { TopBar } from "./TopBar";

// 레이아웃에 상주 — 이동해도 유지되므로 넘김·교체·인트로 연출을 여기서 쥔다
export function BookShell({ children }: { children: ReactNode }) {
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  return (
    <div className="book-shell">
      <div className="book-desk" aria-hidden>
        <ArtPlate art="desk" className="book-desk-art hidden md:flex" />
        <ArtPlate art="desk-m" className="book-desk-art md:hidden" />
      </div>
      <TopBar />
      <ShelfDrawer />
      <BookStage reducedMotion={reducedMotion}>{children}</BookStage>
      <PageAnnouncer />
      <IntroSequence reducedMotion={reducedMotion} />
    </div>
  );
}
