"use client";

import { useEffect, useRef, useState } from "react";
import { bookScrollState, type BookScrollState } from "@/lib/bookScroll";

// 책 구역(sticky 컨테이너)의 스크롤 진행도를 rAF로 샘플링. 상태 갱신은 프레임당 1회.
export function useBookScroll(containerRef: React.RefObject<HTMLElement | null>, pageCount: number): BookScrollState {
  const [state, setState] = useState<BookScrollState>(() => bookScrollState(0, 1, pageCount));
  const raf = useRef<number>(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const tick = () => {
      raf.current = 0;
      const top = el.getBoundingClientRect().top;
      const next = bookScrollState(-top, window.innerHeight, pageCount);
      setState((prev) =>
        prev.page === next.page &&
        prev.fold.every((v, i) => Math.abs(v - next.fold[i]) < 1e-3) &&
        prev.open.every((v, i) => Math.abs(v - next.open[i]) < 1e-3)
          ? prev
          : next
      );
    };
    const onScroll = () => {
      if (!raf.current) raf.current = requestAnimationFrame(tick);
    };
    tick();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf.current) {
        cancelAnimationFrame(raf.current);
        raf.current = 0;
      }
    };
  }, [containerRef, pageCount]);

  return state;
}
