"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { INTRO_VIDEO, type ArtKey } from "@/lib/book/art";
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
  // sessionStorage 읽기(부수효과)만 한 번 캐싱 — 개발 모드 이펙트 이중 실행에도
  // 두 번 읽지 않게. undefined = 아직 안 읽음(null/false와 구분)
  const visited = useRef<boolean | null | undefined>(undefined);
  const playing = useRef(false);

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
    const t = window.setTimeout(() => setPhase(NEXT[phase]), PHASE_MS[phase]);
    return () => window.clearTimeout(t);
  }, [phase]);

  if (phase === "done") return null;

  return (
    <div className="intro-layer" data-phase={phase}>
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
        <div className="intro-hand-open">
          <ArtPlate art="hand-open" className="size-full object-contain" />
        </div>
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
        <button type="button" className="intro-skip" onClick={() => setPhase("done")}>
          건너뛰기
        </button>
      )}
    </div>
  );
}
