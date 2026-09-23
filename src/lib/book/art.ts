import type { BookId } from "./books";

// 책 홈 그림 레지스트리 — src가 null이면 ArtPlate가 라벨 판으로 대신 그린다.
// 그림이 도착하면 Task 11에서 "/home/book/art/<키>.webp"로 채운다 (원장: docs/book-art/PROMPTS.md)
export type ArtKey =
  | "gate" | "gate-m" | "office" | "office-m" | "shelf" | "desk" | "desk-m"
  | "hand-pull" | "hand-open" | "okja-shadow" | "mahjong" | "map" | "corner" | "bookmark"
  | `cover-${BookId}` | `spine-${BookId}`;

export interface ArtDef {
  label: string;
  src: string | null;
}

export const ART: Record<ArtKey, ArtDef> = {
  gate: { label: "지옥문", src: null },
  "gate-m": { label: "지옥문 (세로)", src: null },
  office: { label: "옥자의 집무실", src: null },
  "office-m": { label: "옥자의 집무실 (세로)", src: null },
  shelf: { label: "책장", src: null },
  desk: { label: "책상", src: null },
  "desk-m": { label: "책상 (세로)", src: null },
  "hand-pull": { label: "옥자의 손 — 꺼내기", src: null },
  "hand-open": { label: "옥자의 손 — 펼치기", src: null },
  "okja-shadow": { label: "옥자의 그림자", src: null },
  mahjong: { label: "마작 탁자", src: null },
  map: { label: "손그림 지도", src: null },
  corner: { label: "모서리 장식", src: null },
  bookmark: { label: "책갈피", src: null },
  "cover-home": { label: "표지 — 나라카", src: null },
  "cover-about": { label: "표지 — 소개", src: null },
  "cover-location": { label: "표지 — 오시는 길", src: null },
  "cover-menu": { label: "표지 — 메뉴", src: null },
  "cover-staff": { label: "표지 — 요괴", src: null },
  "cover-notice": { label: "표지 — 공지", src: null },
  "cover-events": { label: "표지 — 이벤트", src: null },
  "cover-games": { label: "표지 — 게임", src: null },
  "spine-home": { label: "나라카", src: null },
  "spine-about": { label: "소개", src: null },
  "spine-location": { label: "길", src: null },
  "spine-menu": { label: "메뉴", src: null },
  "spine-staff": { label: "요괴", src: null },
  "spine-notice": { label: "공지", src: null },
  "spine-events": { label: "이벤트", src: null },
  "spine-games": { label: "게임", src: null },
};

// 스토리 원화 (캐러셀 UI 크롭 완료본, 840px 정사각)
export function storySrc(n: number): string {
  return `/story/comic/${String(n).padStart(2, "0")}.webp`;
}

// 인트로 영상 — Task 12에서 채운다. null이면 정지 그림 인트로
export const INTRO_VIDEO: { desktop: string; mobile: string } | null = null;
