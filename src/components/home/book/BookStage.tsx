"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { PrefetchKind } from "next/dist/client/components/router-reducer/router-reducer-types";
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { bookOf, type BookId } from "@/lib/book/books";
import { useBookStore } from "@/lib/book/bookStore";
import { applyScrollTops, findScrollBox, readScrollTops } from "@/lib/book/dom";
import {
  decideSwipe, decideWheel, isNavPending, keyToDir, type FlipDir, type PendingNav, type SwipeStart, type WheelState,
} from "@/lib/book/input";
import { FLIP_CSS_MS, neighborOf, planTransition } from "@/lib/book/navigation";
import { pageKeyOf } from "@/lib/book/pageKey";
import { useMediaQuery } from "@/lib/book/useMediaQuery";
import { ArtPlate } from "./ArtPlate";
import { FlipLayer } from "./FlipLayer";
import { IndexTabs } from "./IndexTabs";
import { PageFooter } from "./PageFooter";
import { SwapSequence } from "./SwapSequence";

export const FLIP_MS = FLIP_CSS_MS;
export const RUSH_TOTAL_MS = 800;
// 넘김을 요청한 뒤 새 쪽이 도착하기까지 기다리는 최대 시간 — 이 안에는 같은 쪽에서 다시 넘기지 않는다
export const NAV_PENDING_MS = 8000;
// 쪽은 전부 동적(DB 조회)이라 기본(auto) 미리 받기는 loading.js가 없으면 아무것도 받지 않는다 →
// 쪽 전체를 받는 full 미리 받기. PrefetchKind는 런타임 값이 내부 경로에만 있어 타입만 가져와 값("full")을 단언한다
const FULL_PREFETCH = "full" as PrefetchKind.FULL;

interface Shown {
  key: string;
  book: BookId | null;
  node: ReactNode;
}

interface Leaving {
  id: string;
  node: ReactNode;
  dir: FlipDir;
  leaves: number;
}

// 연출 중(교체·인트로)이면 입력을 받지 않는다
function isBusy(root: HTMLElement): boolean {
  return root.querySelector(".swap-layer") !== null || document.querySelector(".intro-layer") !== null;
}

export function BookStage({ children, reducedMotion }: { children: ReactNode; reducedMotion: boolean }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const key = pageKeyOf(pathname, searchParams.toString());
  const book = bookOf(pathname);
  const spread = useMediaQuery("(min-width: 768px)");

  const [shown, setShown] = useState<Shown>({ key, book, node: children });
  const [leaving, setLeaving] = useState<Leaving | null>(null);
  const swapRequest = useBookStore((s) => s.swapRequest);
  const clearSwap = useBookStore((s) => s.clearSwap);
  // 인트로 재생 중엔 책 무대 전체(쪽·탭·발치 버튼)를 inert 처리 — Tab·클릭으로 못 닿게
  const introActive = useBookStore((s) => s.introActive);
  // 서랍(모달)이 열려 있는 동안도 무대는 inert — 서랍은 무대 밖 형제라 영향 없음
  const drawerOpen = useBookStore((s) => s.drawerOpen);
  // 서랍 밖에서 생긴 책 교체(로고·본문 링크·뒤로가기) — 이미 도착한 뒤 연출
  const [navSwap, setNavSwap] = useState<{ id: string; from: BookId; to: BookId } | null>(null);
  // 서랍 요청과 다른 곳에 도착한 요청(뒤로가기·로고로 가로챔) — 연출에서 빼고 이펙트에서 지운다
  const [staleSwapId, setStaleSwapId] = useState<number | null>(null);

  // 쪽이 바뀌면 직전 쪽의 순서표로 연출을 정한다 (새 쪽의 BookMeta는 아직 등록 전 — 렌더 중 파생 상태)
  if (shown.key !== key) {
    const prev = useBookStore.getState().current;
    const plan =
      prev && book ? planTransition({ book: prev.book, key: prev.key }, prev.manifest, { book, key }) : null;
    // 직전 쪽은 커밋 전 DOM을 떠서 붙잡는다 — 앱 라우터의 레이아웃 children은 항상 "현재 경로"를 그리는
    // 슬롯이라, 예전 children(ReactNode)을 다시 그리면 새 쪽이 나온다
    // (렌더 단계 = 커밋 전이라 book-live에는 아직 직전 쪽이 있다. 쪽 이동은 클라이언트에서만 일어난다)
    // 의도적으로 렌더 중 DOM을 읽는다 — 이 분기는 커밋 전(직전 쪽 DOM)에서만 실행되고 바로 setState로 버려진다.
    // innerHTML 스냅샷은 폼 값·canvas·미디어 상태·리스너를 못 옮긴다: 쪽에 폼/라디오/id가 생기면 이 방식을 재검토.
    const oldHtml =
      plan?.kind === "flip" ? (document.querySelector("[data-book-live]")?.innerHTML ?? "") : "";
    setShown({ key, book, node: children });
    setLeaving(
      plan?.kind === "flip"
        ? {
            id: `${shown.key}->${key}`,
            node: <div className="flip-snapshot" dangerouslySetInnerHTML={{ __html: oldHtml }} />,
            dir: plan.dir,
            leaves: plan.leaves,
          }
        : null
    );
    if (plan?.kind === "swap" && swapRequest?.to !== plan.to) {
      setNavSwap({ id: `${shown.key}->${key}`, from: plan.from, to: plan.to });
    }
    // 서랍 요청이 가리킨 책이 아닌 곳에 도착 → 그 요청은 끝날 수 없다 (도착 대기에서 영영 멈춤)
    if (swapRequest && book !== swapRequest.to) setStaleSwapId(swapRequest.id);
  } else if (shown.node !== children) {
    // 같은 쪽의 데이터 갱신 (달력 월 이동 등) — 연출 없음
    setShown({ key, book, node: children });
  }

  // 진행할 교체 연출 — 서랍 요청이 우선, 없으면 경로 변화로 감지한 교체
  const liveRequest = swapRequest && swapRequest.id !== staleSwapId ? swapRequest : null;
  const activeSwap = liveRequest
    ? { id: `r${liveRequest.id}`, from: liveRequest.from, to: liveRequest.to, fast: liveRequest.fast }
    : navSwap
      ? { ...navSwap, fast: false }
      : null;
  // 버려진 요청은 스토어에서 지운다 — 스토어 갱신은 렌더 밖(타이머)에서
  useEffect(() => {
    if (staleSwapId === null || swapRequest?.id !== staleSwapId) return;
    const t = window.setTimeout(() => clearSwap(staleSwapId), 0);
    return () => window.clearTimeout(t);
  }, [staleSwapId, swapRequest, clearSwap]);
  // onDone이 렌더마다 바뀌면 SwapSequence 이펙트가 다시 돌아 단계 타이머가 초기화된다 → 고정
  const finishSwap = useCallback(() => {
    if (liveRequest) clearSwap(liveRequest.id);
    setNavSwap(null);
  }, [liveRequest, clearSwap, setNavSwap]);

  const stageRef = useRef<HTMLDivElement>(null);
  const liveRef = useRef<HTMLDivElement>(null);
  const scrollTops = useRef<number[]>([]);
  const wheel = useRef<WheelState>({ armedDir: null, lastWheelAt: 0, lockedUntil: 0 });
  // 넘김 요청 후 새 쪽 도착 전 — 그동안 current는 아직 직전 쪽이라 같은 목적지로 두 번 push되는 걸 막는다
  const pendingNav = useRef<PendingNav | null>(null);
  const navPending = useCallback(
    () => isNavPending(pendingNav.current, useBookStore.getState().current?.key ?? null, performance.now()),
    []
  );

  // 휠·키·스와이프·발치 버튼이 모두 여기로 — 대기 중이면 무시
  const go = useCallback(
    (dir: FlipDir) => {
      const current = useBookStore.getState().current;
      if (!current || navPending()) return;
      const now = performance.now();
      const target = neighborOf(current.manifest, current.key, dir);
      if (!target) return;
      pendingNav.current = { from: current.key, until: now + NAV_PENDING_MS };
      wheel.current.lockedUntil = now + FLIP_MS;
      router.push(target.href, { scroll: false });
    },
    [router, navPending]
  );

  // 새 쪽이 도착하면 대기를 푼다
  useEffect(() => {
    pendingNav.current = null;
  }, [shown.key]);
  // 넘김 연출이 시작되면 그때부터 FLIP_MS 동안 입력을 막는다 (느린 망에선 요청 시각의 잠금이 이미 풀려 있다)
  useEffect(() => {
    if (!leaving) return;
    wheel.current.lockedUntil = Math.max(wheel.current.lockedUntil, performance.now() + FLIP_MS);
  }, [leaving]);

  // 입력: 휠 · 스와이프 · 키보드
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const onWheel = (e: WheelEvent) => {
      if (useBookStore.getState().drawerOpen || isBusy(stage)) return;
      const now = performance.now();
      if (navPending()) {
        // 도착 전 관성 이벤트도 "직전 휠"로 기록해 두어야 도착 직후 새 제스처로 오인하지 않는다
        wheel.current.lastWheelAt = now;
        wheel.current.armedDir = null;
        return;
      }
      const decision = decideWheel(e.deltaY, findScrollBox(e.target, stage), wheel.current, now);
      const state = wheel.current;
      state.lastWheelAt = now;
      if (decision.action === "scroll") state.armedDir = null;
      else if (decision.action === "arm") state.armedDir = decision.dir;
      else if (decision.action === "flip") {
        state.armedDir = null;
        go(decision.dir);
      }
    };
    let swipe: SwipeStart | null = null;
    const onTouchStart = (e: TouchEvent) => {
      swipe = e.touches.length === 1 ? { y: e.touches[0].clientY, box: findScrollBox(e.target, stage) } : null;
    };
    const onTouchEnd = (e: TouchEvent) => {
      if (!swipe || isBusy(stage) || navPending() || performance.now() < wheel.current.lockedUntil) {
        swipe = null;
        return;
      }
      const dir = decideSwipe(swipe, e.changedTouches[0].clientY);
      swipe = null;
      if (dir) go(dir);
    };
    const onKey = (e: KeyboardEvent) => {
      if (useBookStore.getState().drawerOpen || isBusy(stage)) return;
      const target = e.target instanceof HTMLElement ? e.target : null;
      const dir = keyToDir(e.key, target?.tagName ?? "", target?.isContentEditable ?? false);
      if (!dir || performance.now() < wheel.current.lockedUntil) return;
      e.preventDefault();
      if (navPending()) return;
      go(dir);
    };
    stage.addEventListener("wheel", onWheel, { passive: true });
    stage.addEventListener("touchstart", onTouchStart, { passive: true });
    stage.addEventListener("touchend", onTouchEnd, { passive: true });
    window.addEventListener("keydown", onKey);
    return () => {
      stage.removeEventListener("wheel", onWheel);
      stage.removeEventListener("touchstart", onTouchStart);
      stage.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("keydown", onKey);
    };
  }, [go, navPending]);

  // 넘김 복제본이 직전 스크롤 위치에서 출발하도록 계속 기록
  useEffect(() => {
    const live = liveRef.current;
    if (!live) return;
    const onScroll = () => {
      scrollTops.current = readScrollTops(live);
    };
    live.addEventListener("scroll", onScroll, { capture: true, passive: true });
    return () => live.removeEventListener("scroll", onScroll, { capture: true });
  }, []);

  // 새 쪽은 맨 위에서 시작 — 쪽 구조(Spread)가 같으면 React가 스크롤 칸 DOM을 재사용해 직전 위치가 남는다
  useLayoutEffect(() => {
    if (liveRef.current) applyScrollTops(liveRef.current, []);
  }, [shown.key]);

  // 다음·이전 쪽 미리 받기
  const current = useBookStore((s) => s.current);
  useEffect(() => {
    if (!current) return;
    for (const dir of [1, -1] as const) {
      const n = neighborOf(current.manifest, current.key, dir);
      if (n) router.prefetch(n.href, { kind: FULL_PREFETCH });
    }
  }, [current, router]);

  // 쪽이 바뀌고 넘김이 끝나면 새 쪽 제목으로 포커스, 스크롤 기록 초기화
  const mounted = useRef(false);
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    if (leaving) return;
    scrollTops.current = [];
    liveRef.current?.querySelector<HTMLElement>("[data-book-title]")?.focus({ preventScroll: true });
  }, [shown.key, leaving]);

  return (
    <div ref={stageRef} className="book-stage" inert={introActive || drawerOpen}>
      <div className="book">
        <div ref={liveRef} className="book-live book-paper" data-book-live="">
          {shown.node}
        </div>
        {/* 책갈피 리본 — 쪽이 아니라 책에 달려 있어 넘겨도 제자리 */}
        <div className="book-ribbon" aria-hidden>
          <ArtPlate art="bookmark" />
        </div>
        {leaving && (
          <FlipLayer
            key={leaving.id}
            oldNode={leaving.node}
            newNode={shown.node}
            dir={leaving.dir}
            leaves={leaving.leaves}
            spread={spread}
            reducedMotion={reducedMotion}
            oldScrollTops={scrollTops}
            onDone={() => setLeaving(null)}
          />
        )}
        <IndexTabs />
      </div>
      <PageFooter onGo={go} />
      {activeSwap && (
        <SwapSequence
          key={activeSwap.id}
          from={activeSwap.from}
          to={activeSwap.to}
          arrived={book === activeSwap.to}
          fast={activeSwap.fast}
          reducedMotion={reducedMotion}
          onDone={finishSwap}
        />
      )}
    </div>
  );
}
