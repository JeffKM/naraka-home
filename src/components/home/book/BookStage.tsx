"use client";

import type { ReactNode } from "react";

// 임시 — 넘김 없이 현재 쪽만 보여준다
export function BookStage({ children }: { children: ReactNode; reducedMotion: boolean }) {
  return (
    <div className="book-stage">
      <div className="book">
        <div className="book-live">{children}</div>
      </div>
    </div>
  );
}
