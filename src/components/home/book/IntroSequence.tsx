"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { INTRO_VIDEO, type ArtKey } from "@/lib/book/art";
import { useBookStore } from "@/lib/book/bookStore";
import { INTRO_VISITED_KEY, introMode, isHomeRoot } from "@/lib/book/intro";
import { ArtPlate } from "./ArtPlate";

type Phase = "hold" | "video" | "gate" | "office" | "shelf" | "open" | "done";

const PHASE_MS: Record<"gate" | "office" | "shelf" | "open", number> = {
  gate: 1200,
  office: 1400,
  shelf: 1000,
  open: 1050,
};
const NEXT: Record<"gate" | "office" | "shelf" | "open", Phase> = {
  gate: "office",
  office: "shelf",
  shelf: "open",
  open: "done",
};
const VIDEO_START_TIMEOUT_MS = 3000;

function readVisited(): boolean | null {
  try {
    const seen = window.sessionStorage.getItem(INTRO_VISITED_KEY) === "1";
    window.sessionStorage.setItem(INTRO_VISITED_KEY, "1");
    return seen;
  } catch {
    return null;
  }
}

function ScenePair({ desktop, mobile }: { desktop: ArtKey; mobile: ArtKey }) {
  return (
    <>
      <ArtPlate art={desktop} className="intro-fill hidden md:flex" />
      <ArtPlate art={mobile} className="intro-fill md:hidden" />
    </>
  );
}

// 지옥문 → 집무실 → 책장 → 책상에서 펼침. 홈 첫 쪽은 서버에서 문 닫힌 정지 화면(hold)으로 시작해
// 첫 페인트에 홈이 비치지 않게 하고, 하이드레이션 뒤 모드를 정한다
export function IntroSequence({ reducedMotion }: { reducedMotion: boolean }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [phase, setPhase] = useState<Phase>(() =>
    isHomeRoot(pathname, searchParams.toString()) ? "hold" : "done"
  );
  const setIntroActive = useBookStore((s) => s.setIntroActive);
  const introActive = useBookStore((s) => s.introActive);
  // sessionStorage 읽기(부수효과)만 한 번 캐싱 — 개발 모드 이펙트 이중 실행에도
  // 두 번 읽지 않게. undefined = 아직 안 읽음(null/false와 구분)
  const visited = useRef<boolean | null | undefined>(undefined);
  const playing = useRef(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const skipRef = useRef<HTMLButtonElement>(null);
  const skipFocused = useRef(false);
  // 인트로가 끝나는 순간 포커스가 인트로 레이어 안에 있었는지 — 있었을 때만 책 쪽으로 옮긴다
  const restoreFocus = useRef(false);

  // 인트로를 끝낸다 — 끝나는 순간 포커스가 어디 있었는지 먼저 기록해 둔다. 뒤 요소(상단 바·책
  // 무대)는 아직 inert라 지금 바로 옮길 순 없고, 스토어 반영 뒤(포커스 복원 이펙트)에 옮긴다
  const finish = useCallback(() => {
    restoreFocus.current = rootRef.current?.contains(document.activeElement) ?? false;
    setPhase("done");
  }, []);

  // 모드 결정 — reducedMotion은 하이드레이션 안전을 위해 useMediaQuery가 첫 페인트엔
  // false를 주고 뒤이은 이펙트에서 실제 값으로 맞춘다. 여기서 순수 계산(introMode)까지
  // 캐싱해버리면 그 첫 false가 영구 고정돼 reduced-motion에서도 짧은 인트로가 새는다 →
  // 부수효과(sessionStorage 읽기)만 캐싱하고 모드는 hold인 동안 매번 최신 값으로 다시 계산한다
  useEffect(() => {
    if (phase !== "hold") return;
    if (visited.current === undefined) visited.current = readVisited();
    const mode = introMode({
      pathname,
      search: searchParams.toString(),
      visited: visited.current,
      reducedMotion,
    });
    const t = window.setTimeout(() => {
      setPhase(mode === "full" ? (INTRO_VIDEO ? "video" : "gate") : mode === "short" ? "open" : "done");
    }, 0);
    return () => window.clearTimeout(t);
  }, [phase, pathname, searchParams, reducedMotion]);

  // 단계 타이머
  useEffect(() => {
    if (phase === "hold" || phase === "done") return;
    if (phase === "video") {
      const t = window.setTimeout(() => {
        if (!playing.current) setPhase("open");
      }, VIDEO_START_TIMEOUT_MS);
      return () => window.clearTimeout(t);
    }
    const t = window.setTimeout(() => {
      const next = NEXT[phase];
      if (next === "done") finish();
      else setPhase(next);
    }, PHASE_MS[phase]);
    return () => window.clearTimeout(t);
  }, [phase, finish]);

  // 인트로 도중(뒤로가기 등으로) 경로가 바뀌면 더는 홈 첫 쪽이 아니므로 즉시 끝낸다
  useEffect(() => {
    if (phase === "hold" || phase === "done") return;
    if (isHomeRoot(pathname, searchParams.toString())) return;
    const t = window.setTimeout(finish, 0);
    return () => window.clearTimeout(t);
  }, [phase, pathname, searchParams, finish]);

  // 인트로 활성 상태를 스토어에 반영 — 상단 바·책 무대가 이 값으로 inert 여부를 정한다
  useEffect(() => {
    const active = phase !== "hold" && phase !== "done";
    const t = window.setTimeout(() => setIntroActive(active), 0);
    return () => window.clearTimeout(t);
  }, [phase, setIntroActive]);

  // 건너뛰기 버튼이 처음 나타나면 포커스를 옮긴다 — Tab이 뒤 요소로 새지 않고 바로 건너뛰기로
  useEffect(() => {
    if (phase === "hold" || phase === "done" || skipFocused.current) return;
    skipFocused.current = true;
    skipRef.current?.focus();
  }, [phase]);

  // 인트로가 물러나 뒤 요소의 inert가 실제로 풀린 뒤 — body에 포커스를 남기지 않고 책 쪽 제목으로
  useEffect(() => {
    if (introActive || !restoreFocus.current) return;
    restoreFocus.current = false;
    document.querySelector<HTMLElement>("[data-book-title]")?.focus({ preventScroll: true });
  }, [introActive]);

  if (phase === "done") return null;

  return (
    <div ref={rootRef} className="intro-layer" data-phase={phase}>
      {/* JS가 없으면 인트로를 건너뛴다 */}
      <noscript>
        <style>{".intro-layer{display:none}"}</style>
      </noscript>
      <div className="intro-scene intro-office">
        <ScenePair desktop="office" mobile="office-m" />
      </div>
      <div className="intro-scene intro-shelf">
        <ArtPlate art="shelf" className="intro-fill" />
        <div className="intro-hand-pull">
          <ArtPlate art="hand-pull" className="size-full object-contain" />
        </div>
      </div>
      <div className="intro-scene intro-desk">
        <ScenePair desktop="desk" mobile="desk-m" />
        <div className="intro-cover">
          <ArtPlate art="cover-home" className="size-full object-contain" />
        </div>
        {/* hand-open은 손이 갈색 책 위에 얹힌 그림이라 빨강 표지와 겹치면 책이 두 권으로 보여 뺀다 —
            "손만, 책 없이" 리테이크가 오면 다시 넣는다 (Task 11 리포트) */}
      </div>
      <div className="intro-gate">
        <div className="intro-door intro-door-l">
          <ScenePair desktop="gate" mobile="gate-m" />
        </div>
        <div className="intro-door intro-door-r">
          <ScenePair desktop="gate" mobile="gate-m" />
        </div>
        <div className="intro-shadow">
          <ArtPlate art="okja-shadow" className="size-full object-contain" />
        </div>
      </div>
      {phase === "video" && INTRO_VIDEO && (
        <video
          className="intro-video"
          autoPlay
          muted
          playsInline
          preload="auto"
          onPlaying={() => {
            playing.current = true;
          }}
          onEnded={() => setPhase("open")}
          onError={() => setPhase("open")}
        >
          <source media="(min-width: 768px)" src={INTRO_VIDEO.desktop} type="video/mp4" />
          <source src={INTRO_VIDEO.mobile} type="video/mp4" />
        </video>
      )}
      {phase !== "hold" && (
        <button type="button" ref={skipRef} className="intro-skip" onClick={finish}>
          건너뛰기
        </button>
      )}
    </div>
  );
}
