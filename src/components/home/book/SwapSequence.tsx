"use client";

import { useEffect, useState } from "react";
import type { BookId } from "@/lib/book/books";
import { ArtPlate } from "./ArtPlate";

type Phase = "close" | "shelf" | "pull" | "wait" | "open" | "done";

const PHASE_MS: Record<"close" | "shelf" | "pull" | "open", number> = {
  close: 300,
  shelf: 400,
  pull: 400,
  open: 350,
};

// 도착 대기 안전장치 — 이동이 취소·실패해 새 책이 끝내 오지 않아도 연출을 걷는다
export const SWAP_WAIT_TIMEOUT_MS = 8000;

interface Props {
  from: BookId;
  to: BookId;
  arrived: boolean; // 새 책의 쪽이 무대에 도착했나
  fast: boolean; // 연출 중 재선택 → 펼치기 직전으로 건너뜀
  reducedMotion: boolean;
  onDone: () => void;
}

// 덮기 → 책장에 꽂기 → 새 책 꺼내기 → (도착 대기) → 펼치기. 총 ≤ 1.5초
export function SwapSequence({ from, to, arrived, fast, reducedMotion, onDone }: Props) {
  const [phase, setPhase] = useState<Phase>(fast ? "wait" : "close");

  // 시간으로 넘어가는 단계 — arrived를 의존성에 두면 도착 순간 진행 중인 단계 타이머가 처음부터 다시 돈다
  useEffect(() => {
    if (reducedMotion || phase === "wait" || phase === "done") return;
    const next: Record<"close" | "shelf" | "pull" | "open", Phase> = {
      close: "shelf",
      shelf: "pull",
      pull: "wait",
      open: "done",
    };
    const t = window.setTimeout(() => setPhase(next[phase]), PHASE_MS[phase]);
    return () => window.clearTimeout(t);
  }, [phase, reducedMotion]);

  // 도착·종료로 넘어가는 단계
  useEffect(() => {
    if (reducedMotion) {
      if (!arrived) return;
      const t = window.setTimeout(onDone, 0);
      return () => window.clearTimeout(t);
    }
    if (phase === "done") {
      const t = window.setTimeout(onDone, 0);
      return () => window.clearTimeout(t);
    }
    if (phase === "wait" && arrived) {
      const t = window.setTimeout(() => setPhase("open"), 0);
      return () => window.clearTimeout(t);
    }
  }, [phase, arrived, reducedMotion, onDone]);

  // 도착 대기가 너무 길면 포기 — arrived는 의존성에서 빼서 대기 시작부터 잰다
  useEffect(() => {
    if (!reducedMotion && phase !== "wait") return;
    const t = window.setTimeout(onDone, SWAP_WAIT_TIMEOUT_MS);
    return () => window.clearTimeout(t);
  }, [phase, reducedMotion, onDone]);

  if (reducedMotion) return null;

  return (
    <div className="swap-layer" data-phase={phase} aria-hidden>
      <div className="swap-shelf">
        <ArtPlate art="shelf" className="size-full object-cover" />
      </div>
      <div className="swap-book swap-book-from">
        <ArtPlate art={`cover-${from}`} className="size-full object-contain" />
      </div>
      <div className="swap-book swap-book-to">
        <ArtPlate art={`cover-${to}`} className="size-full object-contain" />
      </div>
      <div className="swap-hand swap-hand-pull">
        <ArtPlate art="hand-pull" className="size-full object-contain" />
      </div>
      <div className="swap-hand swap-hand-open">
        <ArtPlate art="hand-open" className="size-full object-contain" />
      </div>
    </div>
  );
}
