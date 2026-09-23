import type { BookId } from "./books";

export type PageKind = "toc" | "list" | "detail" | "content";

// 책 순서표의 한 쪽
export interface BookPageRef {
  key: string; // pageKeyOf 결과
  href: string; // 이동할 주소
  tab: string; // 인덱스 탭 이름
  kind: PageKind;
}

export interface PageLocation {
  book: BookId;
  key: string;
}

export type TransitionPlan =
  | { kind: "none" }
  | { kind: "flip"; dir: 1 | -1; leaves: number }
  | { kind: "swap"; from: BookId; to: BookId };

export const MIN_RUSH_LEAVES = 3;
export const MAX_RUSH_LEAVES = 5;
export const MAX_TABS = 8;

// 넘김 연출 시간 — book.css와 맞춘다 (보통 600ms, 후루룩이면 장마다 70ms 지연 + 450ms, 동작 줄이기면 150ms 페이드)
export const FLIP_CSS_MS = 600;
export const RUSH_FLIP_CSS_MS = 450;
export const RUSH_LEAF_DELAY_MS = 70;
export const FADE_CSS_MS = 150;
export const FLIP_BACKSTOP_SLACK_MS = 400;

// animationend가 끝내 오지 않을 때(탭 숨김·애니메이션 취소 등) 연출을 강제로 끝낼 시각
export function flipBackstopMs(leaves: number, reducedMotion: boolean): number {
  const run = reducedMotion
    ? FADE_CSS_MS
    : leaves > 0
      ? leaves * RUSH_LEAF_DELAY_MS + RUSH_FLIP_CSS_MS
      : FLIP_CSS_MS;
  return run + FLIP_BACKSTOP_SLACK_MS;
}

export function indexOfKey(manifest: readonly BookPageRef[], key: string): number {
  return manifest.findIndex((r) => r.key === key);
}

export function neighborOf(
  manifest: readonly BookPageRef[],
  key: string,
  dir: 1 | -1
): BookPageRef | null {
  const i = indexOfKey(manifest, key);
  if (i === -1) return null;
  return manifest[i + dir] ?? null;
}

// 직전 쪽(과 그 책의 순서표)에서 다음 쪽으로 갈 때의 연출을 정한다
export function planTransition(
  prev: PageLocation,
  prevManifest: readonly BookPageRef[],
  next: PageLocation
): TransitionPlan {
  if (prev.book !== next.book) return { kind: "swap", from: prev.book, to: next.book };
  if (prev.key === next.key) return { kind: "none" };
  const i = indexOfKey(prevManifest, prev.key);
  const j = indexOfKey(prevManifest, next.key);
  if (i === -1 || j === -1) return { kind: "flip", dir: 1, leaves: 0 };
  const distance = Math.abs(j - i);
  const leaves =
    distance > 1 ? Math.min(MAX_RUSH_LEAVES, Math.max(MIN_RUSH_LEAVES, distance - 1)) : 0;
  return { kind: "flip", dir: j > i ? 1 : -1, leaves };
}

// 인덱스 탭에 붙일 쪽 — 상세 쪽은 책 전체가 8쪽 이하일 때만
export function tabRefs(manifest: readonly BookPageRef[]): BookPageRef[] {
  if (manifest.length <= MAX_TABS) return [...manifest];
  return manifest.filter((r) => r.kind !== "detail").slice(0, MAX_TABS);
}
