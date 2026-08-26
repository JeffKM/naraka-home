# 나라카 팝업북 홈 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 카페 홈 첫 화면을 "접힌 동화책 마을"(표지 + 면 3 + 경첩 감옥, 종이 컷아웃 팝업, 명패 클릭 시 방 안으로 돌리 인)로 교체한다.

**Architecture:** 3D는 판(plane)+텍스처만 그리는 장식·내비 레이어이고, 정보는 전부 HTML(서버 컴포넌트가 채움)이라 3D가 없어도 완결된다. 면·공간·판 정의는 `src/lib/homeBook.ts` 한 곳의 데이터이며, 스크롤→면 진행도·카메라 좌표는 순수 함수로 분리해 vitest로 검증한다. 에셋은 힉스필드 생성 → 배경 제거 → "종이 인형 처리" 스크립트 → WebP.

**Tech Stack:** Next.js 16.2 App Router, React 19.2, TypeScript strict, TailwindCSS v4, `three` + `@react-three/fiber` + `@react-three/drei`(신규), vitest 4, Python 3 + Pillow(에셋 스크립트), higgsfield MCP(이미지 생성·배경 제거).

**스펙:** `docs/superpowers/specs/2026-08-27-popup-book-home-design.md`

## Global Constraints

- 워크트리 `/Users/jefflee/workspace/naraka-home-wt` (브랜치 `feat/naraka-home`)에서만 작업. `main` 직접 수정 금지. PR #80은 8/31 이후 병합.
- 커밋 메시지·주석·문서 한국어. 들여쓰기 2칸, 세미콜론, 더블 쿼트, `any` 금지.
- lucide-react 개별 임포트. UI 문구에 이모지 금지.
- 캐논: 등장인물 옥자·미호·멜·바나·주방요괴·방문자, 펫 시온·코코·규종·선아·수아. 새 인물 금지. 금지 어휘(저승 이승 천계 명계 명부 도깨비 옥황상제 염라대왕 원혼 혼령 혼백 영혼 삼도천 환생 상여 성불 극락) — 단 스토리 원문의 "도깨비불"은 허용.
- 글자는 그림에 넣지 않는다. 간판·명패도 HTML 텍스트.
- 팔레트는 `src/app/(home)/home.css`의 토큰을 따른다: `--home-void #0d0c11`, `--home-bg #131117`, `--home-rosewood #6b4a44`, `--home-rosewood-deep #3a2a26`, `--home-parchment #d1b89d`, `--home-cream #e6d4b8`, `--home-red #a34c37`, `--home-chalk #dfdfdf`.
- 성능 예산: 초기 텍스처 ≤ 1.5MB, 판당 텍스처 ≤ 1024², 면당 드로우콜 ≤ 40, three 번들은 홈 `/`에서만 로드.
- 폴백: WebGL 불가 · `prefers-reduced-motion` · `deviceMemory < 2` · `saveData` → 정지 이미지 + 8곳 목록.
- 인물 컷아웃은 **작가 웹 사용 동의 확인 후** 배포. 그 전엔 실루엣 판.
- 각 Task 끝에 `npx eslint src && npx tsc --noEmit` 통과. 병합 전 `npm run build`.
- 검증 스크린샷 뷰포트: 390×844, 1440×900. Playwright MCP 스크린샷은 셸 cwd에 떨어짐(`.playwright-mcp/` 아님).

---

## 파일 구조

```
src/lib/homeBook.ts                          면·공간·판 데이터 + 판 등장 진행도 함수 (순수)
src/lib/homeBook.test.ts
src/lib/bookScroll.ts                        스크롤 → 면 진행도 (순수)
src/lib/bookScroll.test.ts
src/lib/bookCamera.ts                        뷰 → 카메라 좌표·easing (순수)
src/lib/bookCamera.test.ts
src/components/home/book/PopupBookLoader.tsx 클라이언트: 능력 감지 → 폴백 or dynamic import
src/components/home/book/PopupBook.tsx       캔버스 루트, 스크롤·방 상태, 카메라 lerp
src/components/home/book/BookPage.tsx        면 하나(경첩 회전) + 판들
src/components/home/book/PaperLayer.tsx      판 하나(텍스처 plane + 경첩 회전)
src/components/home/book/Jail.tsx            경첩 감옥(빗금 3종)
src/components/home/book/RoomPlates.tsx      명패 HTML 버튼
src/components/home/book/RoomPanel.tsx       방 정보 패널(HTML, home-paper)
src/components/home/book/BookFallback.tsx    폴백(정지 이미지 + 목록)
src/components/home/book/useBookScroll.ts    rAF 스크롤 훅 (bookScroll.ts 래핑)
src/app/(home)/page.tsx                      DeskHero → PopupBookLoader 교체, 방 패널 내용 주입
src/app/(home)/home.css                      .home-book-* 스타일 추가
public/home/book/{cover,p1,p2,p3,rooms}/     WebP 에셋
scripts/book/paperdoll.py                    종이 인형 처리 (테두리·질감·그림자)
scripts/book/extract_character.py            원화에서 인물 오려내기
scripts/book/PROMPTS.md                      힉스필드 프롬프트 원장
```

---

### Task 1: 의존성 + 면·공간·판 데이터 모델

**Files:**
- Modify: `package.json`
- Create: `src/lib/homeBook.ts`
- Test: `src/lib/homeBook.test.ts`

**Interfaces:**
- Produces: `PaperLayerDef`, `BookRoomDef`, `BookPageDef`, `BOOK_PAGES`, `BOOK_ROOMS`, `PAGE_W`, `PAGE_H`, `layerOpen(def, pageOpen)`, `roomsOfPage(pageId)`, `findRoom(id)`

- [ ] **Step 1: 의존성 설치**

Run: `cd /Users/jefflee/workspace/naraka-home-wt && npm install three @react-three/fiber @react-three/drei && npm install -D @types/three`
Expected: `package.json` dependencies에 `three`, `@react-three/fiber`, `@react-three/drei` 추가, devDependencies에 `@types/three`. lock 파일은 `rm` 하지 않는다(재생성 금지).

- [ ] **Step 2: 실패하는 테스트 작성**

`src/lib/homeBook.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import {
  BOOK_PAGES,
  BOOK_ROOMS,
  findRoom,
  layerOpen,
  roomsOfPage,
} from "./homeBook";

describe("homeBook 데이터", () => {
  it("면은 3개이고 막 순서대로다", () => {
    expect(BOOK_PAGES.map((p) => p.id)).toEqual(["p1", "p2", "p3"]);
    expect(BOOK_PAGES.map((p) => p.jailTally)).toEqual([5, 10, 15]);
  });

  it("공간 8곳이 전부 존재하는 면을 가리킨다", () => {
    expect(BOOK_ROOMS).toHaveLength(8);
    const pageIds = new Set(BOOK_PAGES.map((p) => p.id));
    for (const r of BOOK_ROOMS) expect(pageIds.has(r.pageId)).toBe(true);
  });

  it("면별 공간 수는 2·2·4다", () => {
    expect(roomsOfPage("p1").map((r) => r.id)).toEqual(["office", "vault"]);
    expect(roomsOfPage("p2").map((r) => r.id)).toEqual(["street", "house"]);
    expect(roomsOfPage("p3").map((r) => r.id)).toEqual(["field", "jail", "cafe", "plaza"]);
  });

  it("방마다 겹이 5개 이상이고 z가 앞으로 갈수록 커진다", () => {
    for (const r of BOOK_ROOMS) {
      expect(r.layers.length).toBeGreaterThanOrEqual(5);
      const zs = r.layers.map((l) => l.z);
      expect([...zs].sort((a, b) => a - b)).toEqual(zs);
    }
  });

  it("findRoom은 없는 id에 undefined", () => {
    expect(findRoom("office")?.label).toBe("사무소");
    expect(findRoom("nope")).toBeUndefined();
  });
});

describe("layerOpen — 판 등장 진행도", () => {
  const def = { open: 0.4, duration: 0.3 };
  it("등장 시점 전엔 0, 끝나면 1, 중간은 선형", () => {
    expect(layerOpen(def, 0)).toBe(0);
    expect(layerOpen(def, 0.4)).toBe(0);
    expect(layerOpen(def, 0.55)).toBeCloseTo(0.5);
    expect(layerOpen(def, 0.7)).toBe(1);
    expect(layerOpen(def, 1)).toBe(1);
  });
  it("범위 밖 입력은 0~1로 고정", () => {
    expect(layerOpen(def, -1)).toBe(0);
    expect(layerOpen(def, 2)).toBe(1);
  });
});
```

- [ ] **Step 3: 실패 확인**

Run: `npx vitest run src/lib/homeBook.test.ts`
Expected: FAIL — `Cannot find module './homeBook'`

- [ ] **Step 4: 구현**

`src/lib/homeBook.ts`:
```ts
// 팝업북 홈 — 면·공간·판 정의 (데이터만, 렌더 무관)
// 좌표계: 면 하나가 가로 PAGE_W × 세로 PAGE_H 월드 단위. 원점 = 면 바닥 중앙. z는 카메라 쪽이 +.

export const PAGE_W = 16;
export const PAGE_H = 9;

export type Hinge = "bottom" | "left" | "right";

export interface PaperLayerDef {
  id: string;
  /** public 경로. null이면 임시 단색 판 (에셋 전 뼈대용) */
  src: string | null;
  /** 월드 단위 크기 */
  w: number;
  h: number;
  /** 판 경첩 위치 (bottom: 아래 변 중앙, left/right: 세로 변 아래) */
  x: number;
  y: number;
  z: number;
  hinge: Hinge;
  /** 면 열림 진행도(0~1) 중 이 판이 일어서기 시작하는 시점 */
  open: number;
  /** 일어서는 데 쓰는 진행도 길이 */
  duration: number;
  /** 임시 판 색 (src null일 때) */
  tint?: string;
}

export interface BookRoomDef {
  id: string;
  pageId: BookPageId;
  /** 명패 문안 */
  label: string;
  /** 정보 패널 제목 */
  title: string;
  /** "더 보기" 목적지 */
  href: string;
  hrefLabel: string;
  /** 명패 위치 (면 좌표) */
  plate: { x: number; y: number };
  /** 방 안 카메라 도착점 (면 좌표) */
  cameraIn: { x: number; y: number; z: number };
  /** 터널북 겹 — z 오름차순 (뒤→앞) */
  layers: PaperLayerDef[];
}

export type BookPageId = "p1" | "p2" | "p3";

export interface BookPageDef {
  id: BookPageId;
  act: string;
  /** 경첩 감옥 빗금 수 — 이 면의 끝(다음 면과의 경첩)에 선다 */
  jailTally: 5 | 10 | 15;
  layers: PaperLayerDef[];
}

const layer = (
  id: string,
  partial: Partial<PaperLayerDef> & Pick<PaperLayerDef, "w" | "h" | "x" | "y" | "z">
): PaperLayerDef => ({
  id,
  src: null,
  hinge: "bottom",
  open: 0.3,
  duration: 0.3,
  ...partial,
});

// 방 내부 겹 5종 공통 배치 — 뒤(창밖)부터 앞(문틀)까지
const roomLayers = (roomId: string, tint: string): PaperLayerDef[] => [
  layer(`${roomId}-window`, { w: 6, h: 4, x: 0, y: 0, z: -2.4, open: 0, duration: 0.01, tint: "#131117" }),
  layer(`${roomId}-wall`, { w: 6.4, h: 4.4, x: 0, y: 0, z: -1.8, open: 0, duration: 0.01, tint }),
  layer(`${roomId}-furniture`, { w: 5, h: 3, x: 0, y: 0, z: -1.0, open: 0.5, duration: 0.3, tint: "#3a2a26" }),
  layer(`${roomId}-figure`, { w: 2.2, h: 2.6, x: -0.8, y: 0, z: -0.4, open: 0.7, duration: 0.3, tint: "#d1b89d" }),
  layer(`${roomId}-frame`, { w: 7, h: 5, x: 0, y: 0, z: 0, open: 0.3, duration: 0.3, tint: "#6b4a44" }),
];

export const BOOK_PAGES: BookPageDef[] = [
  {
    id: "p1",
    act: "프롤로그·1막",
    jailTally: 5,
    layers: [
      layer("p1-sky", { w: PAGE_W, h: PAGE_H, x: 0, y: 0, z: -3, open: 0, duration: 0.01, tint: "#0d0c11" }),
      layer("p1-ground", { w: PAGE_W, h: 4, x: 0, y: 0, z: -2.5, hinge: "bottom", open: 0.05, duration: 0.2, tint: "#3a2a26" }),
      layer("p1-office", { w: 5.5, h: 5, x: -4.2, y: 0, z: -1.5, open: 0.3, duration: 0.3, tint: "#6b4a44" }),
      layer("p1-vault", { w: 4.5, h: 4.2, x: 4, y: 0, z: -1.5, open: 0.4, duration: 0.3, tint: "#515151" }),
      layer("p1-props", { w: 3, h: 2, x: 0.5, y: 0, z: -0.8, open: 0.6, duration: 0.3, tint: "#757f70" }),
    ],
  },
  {
    id: "p2",
    act: "2막",
    jailTally: 10,
    layers: [
      layer("p2-sky", { w: PAGE_W, h: PAGE_H, x: 0, y: 0, z: -3, open: 0, duration: 0.01, tint: "#0d0c11" }),
      layer("p2-ground", { w: PAGE_W, h: 4, x: 0, y: 0, z: -2.5, open: 0.05, duration: 0.2, tint: "#3a2a26" }),
      layer("p2-street", { w: 7, h: 5.5, x: -3.5, y: 0, z: -1.5, open: 0.3, duration: 0.3, tint: "#16151c" }),
      layer("p2-house", { w: 5, h: 4.8, x: 4.2, y: 0, z: -1.5, open: 0.4, duration: 0.3, tint: "#6b4a44" }),
      layer("p2-props", { w: 3, h: 2, x: 0.5, y: 0, z: -0.8, open: 0.6, duration: 0.3, tint: "#757f70" }),
    ],
  },
  {
    id: "p3",
    act: "3막·피날레",
    jailTally: 15,
    layers: [
      layer("p3-sky", { w: PAGE_W, h: PAGE_H, x: 0, y: 0, z: -3, open: 0, duration: 0.01, tint: "#0d0c11" }),
      layer("p3-ground", { w: PAGE_W, h: 4, x: 0, y: 0, z: -2.5, open: 0.05, duration: 0.2, tint: "#3a2a26" }),
      layer("p3-field", { w: 5, h: 3.5, x: -5.5, y: 0, z: -1.6, open: 0.3, duration: 0.3, tint: "#757f70" }),
      layer("p3-jail", { w: 3, h: 4, x: -1.5, y: 0, z: -1.4, open: 0.4, duration: 0.3, tint: "#515151" }),
      layer("p3-cafe", { w: 5, h: 5.2, x: 2.5, y: 0, z: -1.5, open: 0.5, duration: 0.3, tint: "#6b4a44" }),
      layer("p3-plaza", { w: 3, h: 3.5, x: 6.2, y: 0, z: -1.2, open: 0.6, duration: 0.3, tint: "#d1b89d" }),
    ],
  },
];

export const BOOK_ROOMS: BookRoomDef[] = [
  { id: "office", pageId: "p1", label: "사무소", title: "마녀의 사무소", href: "/about", hrefLabel: "나라카 이야기 보기",
    plate: { x: -4.2, y: 5.4 }, cameraIn: { x: -4.2, y: 2.2, z: 2.2 }, layers: roomLayers("office", "#6b4a44") },
  { id: "vault", pageId: "p1", label: "금고", title: "금고", href: "/games", hrefLabel: "놀거리 보기",
    plate: { x: 4, y: 4.6 }, cameraIn: { x: 4, y: 2, z: 2.2 }, layers: roomLayers("vault", "#515151") },
  { id: "street", pageId: "p2", label: "간판 거리", title: "「나라카」 간판 거리", href: "/about", hrefLabel: "릴스 보기",
    plate: { x: -3.5, y: 5.9 }, cameraIn: { x: -3.5, y: 2.4, z: 2.2 }, layers: roomLayers("street", "#16151c") },
  { id: "house", pageId: "p2", label: "마녀의 집", title: "마녀의 집", href: "https://instagram.com/naraka_concafe", hrefLabel: "영업시간은 인스타그램에서",
    plate: { x: 4.2, y: 5.2 }, cameraIn: { x: 4.2, y: 2.1, z: 2.2 }, layers: roomLayers("house", "#6b4a44") },
  { id: "field", pageId: "p3", label: "호박밭", title: "호박밭", href: "/location", hrefLabel: "오시는 길",
    plate: { x: -5.5, y: 3.9 }, cameraIn: { x: -5.5, y: 1.6, z: 2.2 }, layers: roomLayers("field", "#757f70") },
  { id: "jail", pageId: "p3", label: "휴게실", title: "감옥, 아니 휴게실", href: "/staff", hrefLabel: "출근 요괴 보기",
    plate: { x: -1.5, y: 4.4 }, cameraIn: { x: -1.5, y: 1.8, z: 2.2 }, layers: roomLayers("jail", "#515151") },
  { id: "cafe", pageId: "p3", label: "카페 본관", title: "홀과 주방", href: "/menu", hrefLabel: "메뉴 보기",
    plate: { x: 2.5, y: 5.6 }, cameraIn: { x: 2.5, y: 2.3, z: 2.2 }, layers: roomLayers("cafe", "#6b4a44") },
  { id: "plaza", pageId: "p3", label: "광장", title: "단체사진 광장", href: "/notice", hrefLabel: "공지 보기",
    plate: { x: 6.2, y: 3.9 }, cameraIn: { x: 6.2, y: 1.6, z: 2.2 }, layers: roomLayers("plaza", "#d1b89d") },
];

/** 면 열림 진행도(0~1)에 대한 판의 일어섬 진행도(0~1) */
export function layerOpen(def: { open: number; duration: number }, pageOpen: number): number {
  const p = Math.min(1, Math.max(0, pageOpen));
  if (def.duration <= 0) return p >= def.open ? 1 : 0;
  return Math.min(1, Math.max(0, (p - def.open) / def.duration));
}

export function roomsOfPage(pageId: BookPageId): BookRoomDef[] {
  return BOOK_ROOMS.filter((r) => r.pageId === pageId);
}

export function findRoom(id: string): BookRoomDef | undefined {
  return BOOK_ROOMS.find((r) => r.id === id);
}
```

- [ ] **Step 5: 통과 확인**

Run: `npx vitest run src/lib/homeBook.test.ts`
Expected: PASS (7 tests)

- [ ] **Step 6: 커밋**

```bash
git add package.json package-lock.json src/lib/homeBook.ts src/lib/homeBook.test.ts
git commit -m "feat(book): three·R3F 의존성 + 팝업북 면·공간·판 데이터 모델"
```

---

### Task 2: 스크롤 → 면 진행도 (순수 함수)

**Files:**
- Create: `src/lib/bookScroll.ts`
- Test: `src/lib/bookScroll.test.ts`

**Interfaces:**
- Produces: `BookScrollState { page: number; fold: number[]; open: number[] }`, `bookScrollState(scrollY, viewportH, pageCount)`, `BOOK_SCROLL_VH = 1` (면당 100vh), `FOLD_ZONE = 0.3`

동작: 책 구역 높이 = `pageCount × 100vh`. 면 i의 구간은 `[i·vh, (i+1)·vh)`. 구간 마지막 30%가 전환 구간 — 현재 면 `fold` 0→1, 다음 면 `open` 0→1. 면 0의 `open`은 스크롤과 무관하게 1(자동 열림은 Task 4가 시간으로 처리).

- [ ] **Step 1: 실패하는 테스트**

`src/lib/bookScroll.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { bookScrollState } from "./bookScroll";

const vh = 1000;

describe("bookScrollState", () => {
  it("맨 위: 면 0 펼쳐짐, 나머지 접힘", () => {
    const s = bookScrollState(0, vh, 3);
    expect(s.page).toBe(0);
    expect(s.open).toEqual([1, 0, 0]);
    expect(s.fold).toEqual([0, 0, 0]);
  });

  it("면 0 구간 70%까지는 전환 없음", () => {
    const s = bookScrollState(690, vh, 3);
    expect(s.page).toBe(0);
    expect(s.fold[0]).toBe(0);
    expect(s.open[1]).toBe(0);
  });

  it("면 0 구간 85%: 면 0 반 접힘, 면 1 반 열림", () => {
    const s = bookScrollState(850, vh, 3);
    expect(s.page).toBe(0);
    expect(s.fold[0]).toBeCloseTo(0.5);
    expect(s.open[1]).toBeCloseTo(0.5);
  });

  it("면 1 시작: 면 0 완전히 접힘, 면 1 열림", () => {
    const s = bookScrollState(1000, vh, 3);
    expect(s.page).toBe(1);
    expect(s.fold[0]).toBe(1);
    expect(s.open[1]).toBe(1);
    expect(s.open[2]).toBe(0);
  });

  it("끝을 지나도 마지막 면은 접히지 않는다", () => {
    const s = bookScrollState(5000, vh, 3);
    expect(s.page).toBe(2);
    expect(s.fold[2]).toBe(0);
    expect(s.open[2]).toBe(1);
  });

  it("음수 스크롤은 0으로", () => {
    expect(bookScrollState(-50, vh, 3)).toEqual(bookScrollState(0, vh, 3));
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run src/lib/bookScroll.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: 구현**

`src/lib/bookScroll.ts`:
```ts
// 스크롤 위치 → 면별 접힘(fold)·열림(open) 진행도. 렌더 무관 순수 함수.

/** 면당 스크롤 길이 (뷰포트 높이 배수) */
export const BOOK_SCROLL_VH = 1;
/** 면 구간 끝에서 전환에 쓰는 비율 */
export const FOLD_ZONE = 0.3;

export interface BookScrollState {
  /** 현재 면 인덱스 */
  page: number;
  /** 면별 접힘 0(펼침)~1(옆으로 접힘) */
  fold: number[];
  /** 면별 열림 0(접힘)~1(판 전부 일어섬) */
  open: number[];
}

export function bookScrollState(scrollY: number, viewportH: number, pageCount: number): BookScrollState {
  const span = viewportH * BOOK_SCROLL_VH;
  const y = Math.max(0, scrollY);
  const page = Math.min(pageCount - 1, Math.floor(y / span));
  const t = page === pageCount - 1 && y >= (pageCount - 1) * span
    ? Math.min(1, (y - page * span) / span)
    : (y - page * span) / span;

  const fold = new Array<number>(pageCount).fill(0);
  const open = new Array<number>(pageCount).fill(0);
  for (let i = 0; i < page; i++) {
    fold[i] = 1;
    open[i] = 1;
  }
  open[page] = 1;

  const isLast = page === pageCount - 1;
  if (!isLast && t > 1 - FOLD_ZONE) {
    const k = (t - (1 - FOLD_ZONE)) / FOLD_ZONE;
    fold[page] = k;
    open[page + 1] = k;
  }
  return { page, fold, open };
}
```

- [ ] **Step 4: 통과 확인**

Run: `npx vitest run src/lib/bookScroll.test.ts`
Expected: PASS (6 tests)

- [ ] **Step 5: 커밋**

```bash
git add src/lib/bookScroll.ts src/lib/bookScroll.test.ts
git commit -m "feat(book): 스크롤 → 면 접힘·열림 진행도 순수 함수"
```

---

### Task 3: 카메라 좌표·easing (순수 함수)

**Files:**
- Create: `src/lib/bookCamera.ts`
- Test: `src/lib/bookCamera.test.ts`

**Interfaces:**
- Consumes: `PAGE_W`, `PAGE_H`, `BookRoomDef` (Task 1)
- Produces: `CameraPose { position: [number, number, number]; target: [number, number, number] }`, `pageCamera(pageIndex, portrait)`, `roomCamera(room, pageIndex)`, `easeInOutCubic(t)`, `pageOffsetX(pageIndex)`, `PAGE_GAP`

면은 x축으로 나란히 놓인다: 면 i의 원점 x = `i × (PAGE_W + PAGE_GAP)`. 접힌 면은 자기 왼쪽 변을 축으로 회전하므로 x 간격은 유지.

- [ ] **Step 1: 실패하는 테스트**

`src/lib/bookCamera.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { BOOK_ROOMS, PAGE_H, PAGE_W } from "./homeBook";
import { easeInOutCubic, pageCamera, pageOffsetX, roomCamera } from "./bookCamera";

describe("pageCamera", () => {
  it("면 0 정면: 면 중앙을 보고 z는 양수", () => {
    const c = pageCamera(0, false);
    expect(c.target).toEqual([0, PAGE_H / 2, 0]);
    expect(c.position[0]).toBe(0);
    expect(c.position[2]).toBeGreaterThan(0);
  });
  it("면 1은 x가 면 간격만큼 이동", () => {
    expect(pageCamera(1, false).target[0]).toBe(pageOffsetX(1));
    expect(pageOffsetX(1)).toBeGreaterThan(PAGE_W);
  });
  it("세로 화면은 더 가까이(z 작음)가 아니라 더 멀리(폭 맞춤)", () => {
    expect(pageCamera(0, true).position[2]).toBeGreaterThan(pageCamera(0, false).position[2]);
  });
});

describe("roomCamera", () => {
  it("방 도착점은 면 오프셋을 더한 cameraIn이고, 타깃은 그 방 뒷벽 쪽", () => {
    const room = BOOK_ROOMS[2]; // street, p2
    const c = roomCamera(room, 1);
    expect(c.position[0]).toBeCloseTo(pageOffsetX(1) + room.cameraIn.x);
    expect(c.position[2]).toBeCloseTo(room.cameraIn.z);
    expect(c.target[2]).toBeLessThan(c.position[2]);
  });
});

describe("easeInOutCubic", () => {
  it("양 끝은 0·1, 중앙은 0.5", () => {
    expect(easeInOutCubic(0)).toBe(0);
    expect(easeInOutCubic(1)).toBe(1);
    expect(easeInOutCubic(0.5)).toBeCloseTo(0.5);
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run src/lib/bookCamera.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: 구현**

`src/lib/bookCamera.ts`:
```ts
// 뷰(면 정면 / 방 안) → 카메라 자세. 렌더 무관 순수 함수.
import { PAGE_H, PAGE_W, type BookRoomDef } from "./homeBook";

export const PAGE_GAP = 2;
/** 정면 카메라 거리 — 가로 화면. FOV 40°에서 면 폭이 화면에 들어오는 거리 */
const PAGE_DIST_LANDSCAPE = 19;
/** 세로 화면 — 폭을 맞추려면 더 멀리 */
const PAGE_DIST_PORTRAIT = 30;

export interface CameraPose {
  position: [number, number, number];
  target: [number, number, number];
}

export function pageOffsetX(pageIndex: number): number {
  return pageIndex * (PAGE_W + PAGE_GAP);
}

export function pageCamera(pageIndex: number, portrait: boolean): CameraPose {
  const x = pageOffsetX(pageIndex);
  const y = PAGE_H / 2;
  return {
    position: [x, y + 1.2, portrait ? PAGE_DIST_PORTRAIT : PAGE_DIST_LANDSCAPE],
    target: [x, y, 0],
  };
}

export function roomCamera(room: BookRoomDef, pageIndex: number): CameraPose {
  const ox = pageOffsetX(pageIndex);
  const { x, y, z } = room.cameraIn;
  return {
    position: [ox + x, y, z],
    target: [ox + x, y - 0.2, z - 3],
  };
}

export function easeInOutCubic(t: number): number {
  const k = Math.min(1, Math.max(0, t));
  return k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
}
```

- [ ] **Step 4: 통과 확인**

Run: `npx vitest run src/lib/bookCamera.test.ts`
Expected: PASS (5 tests)

- [ ] **Step 5: 커밋**

```bash
git add src/lib/bookCamera.ts src/lib/bookCamera.test.ts
git commit -m "feat(book): 면·방 카메라 자세 + easing 순수 함수"
```

---

### Task 4: 캔버스 뼈대 — 판·면·감옥·자동 열림·면 전환 (임시 단색 판)

**Files:**
- Create: `src/components/home/book/PaperLayer.tsx`
- Create: `src/components/home/book/BookPage.tsx`
- Create: `src/components/home/book/Jail.tsx`
- Create: `src/components/home/book/useBookScroll.ts`
- Create: `src/components/home/book/PopupBook.tsx`

**Interfaces:**
- Consumes: Task 1~3 전부
- Produces: `PopupBook` props `{ activeRoom: string | null; onRoomChange(id: string | null): void; children?: ReactNode }` — `children`은 명패(Task 5)가 들어갈 자리. `PaperLayer` props `{ def: PaperLayerDef; open: number }`. `BookPage` props `{ page: BookPageDef; index: number; open: number; fold: number }`.

이 Task는 테스트가 브라우저 검증이다(WebGL은 vitest로 못 돌림). 단, `useBookScroll`이 노출하는 순수 계산은 Task 2에서 이미 검증됨.

- [ ] **Step 1: PaperLayer**

`src/components/home/book/PaperLayer.tsx`:
```tsx
"use client";

import { useTexture } from "@react-three/drei";
import { Suspense } from "react";
import { DoubleSide, SRGBColorSpace, type Texture } from "three";
import type { PaperLayerDef } from "@/lib/homeBook";

// 판 하나 — 경첩을 축으로 눕힘(open 0)→세움(open 1). 조명 없음(MeshBasicMaterial).
function TexturedPlane({ src, w, h }: { src: string; w: number; h: number }) {
  const tex = useTexture(src, (t: Texture) => {
    t.colorSpace = SRGBColorSpace;
    t.anisotropy = 4;
  });
  return (
    <mesh position={[0, h / 2, 0]}>
      <planeGeometry args={[w, h]} />
      <meshBasicMaterial map={tex} transparent alphaTest={0.02} side={DoubleSide} toneMapped={false} />
    </mesh>
  );
}

function TintPlane({ w, h, tint }: { w: number; h: number; tint: string }) {
  return (
    <mesh position={[0, h / 2, 0]}>
      <planeGeometry args={[w, h]} />
      <meshBasicMaterial color={tint} side={DoubleSide} toneMapped={false} />
    </mesh>
  );
}

export function PaperLayer({ def, open }: { def: PaperLayerDef; open: number }) {
  // bottom 경첩: x축 회전, 눕힘은 뒤쪽(-90°). left/right: y축 회전.
  const angle = (1 - open) * (Math.PI / 2);
  const rotation: [number, number, number] =
    def.hinge === "bottom" ? [-angle, 0, 0] : def.hinge === "left" ? [0, angle, 0] : [0, -angle, 0];
  const pivotX = def.hinge === "left" ? -def.w / 2 : def.hinge === "right" ? def.w / 2 : 0;
  return (
    <group position={[def.x, def.y, def.z]}>
      <group position={[pivotX, 0, 0]} rotation={rotation}>
        <group position={[-pivotX, 0, 0]}>
          {def.src ? (
            <Suspense fallback={<TintPlane w={def.w} h={def.h} tint={def.tint ?? "#6b4a44"} />}>
              <TexturedPlane src={def.src} w={def.w} h={def.h} />
            </Suspense>
          ) : (
            <TintPlane w={def.w} h={def.h} tint={def.tint ?? "#6b4a44"} />
          )}
        </group>
      </group>
    </group>
  );
}
```

- [ ] **Step 2: Jail**

`src/components/home/book/Jail.tsx`:
```tsx
"use client";

import { PaperLayer } from "./PaperLayer";
import type { PaperLayerDef } from "@/lib/homeBook";

// 경첩 감옥 — 면의 오른쪽 끝(다음 면과의 접힌 자리)에 선다. 빗금 수에 따라 텍스처만 바뀐다.
const JAIL_SRC: Record<5 | 10 | 15, string | null> = {
  5: null,
  10: null,
  15: null,
};

export function Jail({ tally, open, x }: { tally: 5 | 10 | 15; open: number; x: number }) {
  const def: PaperLayerDef = {
    id: `jail-${tally}`,
    src: JAIL_SRC[tally],
    w: 2.6,
    h: 3.8,
    x,
    y: 0,
    z: -1.2,
    hinge: "bottom",
    open: 0.45,
    duration: 0.3,
    tint: "#515151",
  };
  return <PaperLayer def={def} open={open} />;
}
```

- [ ] **Step 3: BookPage**

`src/components/home/book/BookPage.tsx`:
```tsx
"use client";

import { pageOffsetX } from "@/lib/bookCamera";
import { layerOpen, PAGE_W, type BookPageDef, roomsOfPage } from "@/lib/homeBook";
import { Jail } from "./Jail";
import { PaperLayer } from "./PaperLayer";

// 면 하나 — 왼쪽 변을 축으로 접힌다(fold 0→1 = 0°→-75°). 판들은 open 진행도에 따라 일어선다.
const FOLD_ANGLE = -(75 * Math.PI) / 180;

export function BookPage({
  page,
  index,
  open,
  fold,
  showJail,
}: {
  page: BookPageDef;
  index: number;
  open: number;
  fold: number;
  showJail: boolean;
}) {
  const ox = pageOffsetX(index);
  return (
    <group position={[ox - PAGE_W / 2, 0, 0]} rotation={[0, fold * FOLD_ANGLE, 0]}>
      <group position={[PAGE_W / 2, 0, 0]}>
        {page.layers.map((l) => (
          <PaperLayer key={l.id} def={l} open={layerOpen(l, open)} />
        ))}
        {roomsOfPage(page.id).map((room) =>
          room.layers.map((l) => (
            <group key={l.id} position={[room.cameraIn.x, 0, 0]}>
              <PaperLayer def={l} open={layerOpen(l, open)} />
            </group>
          ))
        )}
        {showJail && <Jail tally={page.jailTally} open={layerOpen({ open: 0.45, duration: 0.3 }, open)} x={PAGE_W / 2 + 0.2} />}
      </group>
    </group>
  );
}
```

- [ ] **Step 4: useBookScroll**

`src/components/home/book/useBookScroll.ts`:
```ts
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
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [containerRef, pageCount]);

  return state;
}
```

- [ ] **Step 5: PopupBook (캔버스 루트)**

`src/components/home/book/PopupBook.tsx`:
```tsx
"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Vector3 } from "three";
import { easeInOutCubic, pageCamera, roomCamera, type CameraPose } from "@/lib/bookCamera";
import { BOOK_PAGES, findRoom } from "@/lib/homeBook";
import { BookPage } from "./BookPage";
import { useBookScroll } from "./useBookScroll";

const AUTO_OPEN_MS = 1200;
const DOLLY_IN_MS = 900;
const DOLLY_OUT_MS = 600;

// 카메라 리그 — 목표 자세로 시간 기반 보간(스크롤·클릭 모두 같은 경로)
function CameraRig({ pose, durationMs }: { pose: CameraPose; durationMs: number }) {
  const { camera } = useThree();
  const from = useRef({ pos: new Vector3(), tgt: new Vector3() });
  const cur = useRef({ pos: new Vector3(...pose.position), tgt: new Vector3(...pose.target) });
  const start = useRef(0);
  const dur = useRef(durationMs);

  useEffect(() => {
    from.current.pos.copy(cur.current.pos);
    from.current.tgt.copy(cur.current.tgt);
    start.current = performance.now();
    dur.current = durationMs;
  }, [pose, durationMs]);

  useFrame(() => {
    const k = easeInOutCubic((performance.now() - start.current) / dur.current);
    cur.current.pos.lerpVectors(from.current.pos, new Vector3(...pose.position), k);
    cur.current.tgt.lerpVectors(from.current.tgt, new Vector3(...pose.target), k);
    camera.position.copy(cur.current.pos);
    camera.lookAt(cur.current.tgt);
  });
  return null;
}

export function PopupBook({
  activeRoom,
  onRoomChange,
  children,
}: {
  activeRoom: string | null;
  onRoomChange: (id: string | null) => void;
  children?: ReactNode;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scroll = useBookScroll(containerRef, BOOK_PAGES.length);
  const [portrait, setPortrait] = useState(false);
  // 자동 1회 열림 — 시간 기반. 면 0의 open은 스크롤과 무관하게 이 값이 상한.
  const [autoOpen, setAutoOpen] = useState(0);

  useEffect(() => {
    const mq = window.matchMedia("(orientation: portrait)");
    const sync = () => setPortrait(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    let raf = 0;
    const t0 = performance.now();
    const step = () => {
      const k = Math.min(1, (performance.now() - t0) / AUTO_OPEN_MS);
      setAutoOpen(k);
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, []);

  // 방에 들어가 있으면 스크롤은 무시하고 방 카메라 유지. Esc로 나감.
  useEffect(() => {
    if (!activeRoom) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onRoomChange(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeRoom, onRoomChange]);

  const room = activeRoom ? findRoom(activeRoom) : undefined;
  const roomPageIndex = room ? BOOK_PAGES.findIndex((p) => p.id === room.pageId) : -1;
  const { pose, durationMs } = useMemo(() => {
    if (room && roomPageIndex >= 0) return { pose: roomCamera(room, roomPageIndex), durationMs: DOLLY_IN_MS };
    return { pose: pageCamera(scroll.page, portrait), durationMs: activeRoom === null ? DOLLY_OUT_MS : 0 };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- scroll.page·portrait·room만 의존
  }, [room, roomPageIndex, scroll.page, portrait]);

  return (
    <div ref={containerRef} className="home-book" style={{ height: `${BOOK_PAGES.length * 100}vh` }}>
      <div className="home-book-stage">
        <Canvas
          aria-hidden
          dpr={[1, 1.5]}
          camera={{ fov: 40, near: 0.1, far: 200, position: pageCamera(0, false).position }}
          gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
        >
          <CameraRig pose={pose} durationMs={durationMs} />
          {BOOK_PAGES.map((p, i) => (
            <BookPage
              key={p.id}
              page={p}
              index={i}
              open={i === 0 ? Math.min(autoOpen, scroll.open[0]) : scroll.open[i]}
              fold={scroll.fold[i]}
              showJail={i < BOOK_PAGES.length - 1}
            />
          ))}
        </Canvas>
        {children}
      </div>
    </div>
  );
}
```

- [ ] **Step 6: 스타일**

`src/app/(home)/home.css` 맨 아래에 추가:
```css
/* ── 팝업북 홈 ───────────────────────────────── */
.home-book {
  position: relative;
}
.home-book-stage {
  position: sticky;
  top: 0;
  height: 100dvh;
  overflow: hidden;
  background: var(--home-void);
}
.home-book-stage canvas {
  display: block;
}
```

- [ ] **Step 7: 임시 연결로 눈 검증**

`src/app/(home)/page.tsx`에서 임시로 `<DeskHero />` 아래에 다음을 추가(Task 6에서 정식 교체):
```tsx
<PopupBookDev />
```
`src/components/home/book/PopupBookDev.tsx`(임시, Task 6에서 삭제):
```tsx
"use client";
import { useState } from "react";
import { PopupBook } from "./PopupBook";
export function PopupBookDev() {
  const [room, setRoom] = useState<string | null>(null);
  return <PopupBook activeRoom={room} onRoomChange={setRoom} />;
}
```
Run: `npm run dev` 후 Playwright MCP로 `http://localhost:3000/` 1440×900 — 스크롤 0·850·1000·2000에서 스크린샷.
Expected: 로드 후 1.2초 안에 면 1의 단색 판들이 순서대로 일어섬 / 850에서 면 1이 왼쪽으로 반쯤 접히고 면 2가 반쯤 일어남 / 1000에서 면 2 정면 / 2000에서 면 3 정면. 콘솔 에러 0.

- [ ] **Step 8: lint·타입**

Run: `npx eslint src && npx tsc --noEmit`
Expected: 0 errors

- [ ] **Step 9: 커밋**

```bash
git add src/components/home/book src/app/\(home\)/home.css src/app/\(home\)/page.tsx
git commit -m "feat(book): 팝업북 캔버스 뼈대 — 판·면·경첩 감옥·자동 열림·면 전환 (임시 단색 판)"
```

---

### Task 5: 명패 + 방 정보 패널 + 돌리 인 + URL 해시

**Files:**
- Create: `src/components/home/book/RoomPlates.tsx`
- Create: `src/components/home/book/RoomPanel.tsx`
- Modify: `src/components/home/book/PopupBook.tsx` (명패를 Canvas 안 `Html`로)
- Modify: `src/app/(home)/home.css`

**Interfaces:**
- Consumes: `BookRoomDef`, `roomsOfPage`, `pageOffsetX`
- Produces: `RoomPlates` props `{ pageIndex: number; activeRoom: string | null; onSelect(id: string): void }` (Canvas 안에서 렌더). `RoomPanel` props `{ room: BookRoomDef | null; onClose(): void; children: ReactNode }` (Canvas 밖 HTML).

- [ ] **Step 1: RoomPlates (Canvas 안, drei Html)**

`src/components/home/book/RoomPlates.tsx`:
```tsx
"use client";

import { Html } from "@react-three/drei";
import { pageOffsetX } from "@/lib/bookCamera";
import { BOOK_PAGES, roomsOfPage } from "@/lib/homeBook";

// 명패 — 판 좌표에 HTML 버튼을 얹는다. 현재 면의 것만 보이고 방에 들어가면 숨긴다.
export function RoomPlates({
  pageIndex,
  activeRoom,
  onSelect,
}: {
  pageIndex: number;
  activeRoom: string | null;
  onSelect: (id: string) => void;
}) {
  const page = BOOK_PAGES[pageIndex];
  if (!page || activeRoom) return null;
  const ox = pageOffsetX(pageIndex);
  return (
    <>
      {roomsOfPage(page.id).map((room) => (
        <Html key={room.id} position={[ox + room.plate.x, room.plate.y, 0.2]} center zIndexRange={[20, 10]}>
          <button
            type="button"
            className="home-book-plate"
            onClick={() => onSelect(room.id)}
            aria-label={`${room.label} — ${room.title} 들어가기`}
          >
            {room.label}
          </button>
        </Html>
      ))}
    </>
  );
}
```

- [ ] **Step 2: RoomPanel (Canvas 밖)**

`src/components/home/book/RoomPanel.tsx`:
```tsx
"use client";

import Link from "next/link";
import { useEffect, useRef, type ReactNode } from "react";
import type { BookRoomDef } from "@/lib/homeBook";

// 방 정보 패널 — 3D 위에 겹치는 한지 시트. 내용은 서버가 children으로 채운다.
export function RoomPanel({
  room,
  onClose,
  children,
}: {
  room: BookRoomDef | null;
  onClose: () => void;
  children: ReactNode;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (room) closeRef.current?.focus();
  }, [room]);
  if (!room) return null;
  const external = room.href.startsWith("http");
  return (
    <div className="home-book-panel" role="dialog" aria-modal="false" aria-labelledby="home-book-panel-title">
      <div className="home-paper p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <h2 id="home-book-panel-title" className="home-plate text-lg font-semibold">
            {room.title}
          </h2>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="home-ui inline-flex min-h-11 min-w-11 items-center justify-center text-sm"
          >
            닫기
          </button>
        </div>
        <div className="mt-3 text-sm">{children}</div>
        {external ? (
          <a href={room.href} target="_blank" rel="noreferrer" className="home-btn mt-4 inline-flex min-h-11 items-center px-4 text-sm">
            {room.hrefLabel}
          </a>
        ) : (
          <Link href={room.href} className="home-btn mt-4 inline-flex min-h-11 items-center px-4 text-sm">
            {room.hrefLabel}
          </Link>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: PopupBook에 명패 배치 + 해시 동기화**

`PopupBook.tsx`의 `<Canvas>` 안, `BookPage` 목록 뒤에 추가:
```tsx
<RoomPlates pageIndex={scroll.page} activeRoom={activeRoom} onSelect={onRoomChange} />
```
import 추가: `import { RoomPlates } from "./RoomPlates";`

`PopupBook.tsx`에 해시 동기화 effect 추가(자동 열림 effect 아래):
```tsx
// URL 해시 — 방 진입을 뒤로 가기·공유에 남긴다 (#room=office)
useEffect(() => {
  const fromHash = () => {
    const m = /room=([a-z]+)/.exec(window.location.hash);
    onRoomChange(m && findRoom(m[1]) ? m[1] : null);
  };
  fromHash();
  window.addEventListener("hashchange", fromHash);
  return () => window.removeEventListener("hashchange", fromHash);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- 마운트 1회
}, []);

useEffect(() => {
  const want = activeRoom ? `#room=${activeRoom}` : "";
  if (window.location.hash === want) return;
  if (want) history.pushState(null, "", want);
  else history.replaceState(null, "", window.location.pathname + window.location.search);
}, [activeRoom]);
```

- [ ] **Step 4: 스타일**

`home.css` 팝업북 블록에 추가:
```css
.home-book-plate {
  font-family: var(--font-hahmlet), serif;
  min-height: 44px;
  padding: 0 14px;
  border: 1.5px solid var(--home-chalk);
  background: var(--home-slate);
  color: var(--home-chalk);
  white-space: nowrap;
  letter-spacing: 0.02em;
  box-shadow: 0 2px 0 #000;
}
.home-book-plate:hover,
.home-book-plate:focus-visible {
  border-color: var(--home-red);
  outline: 2px solid var(--home-wisp);
  outline-offset: 2px;
}
.home-book-panel {
  position: absolute;
  inset: auto 0 0 0;
  z-index: 30;
  max-height: 70dvh;
  overflow-y: auto;
  padding: 0 16px 16px;
  margin: 0 auto;
  max-width: 40rem;
}
@media (min-width: 768px) {
  .home-book-panel {
    inset: 0 24px 0 auto;
    display: flex;
    align-items: center;
    max-height: none;
    width: 22rem;
    padding: 0;
  }
}
```

- [ ] **Step 5: 브라우저 검증**

`PopupBookDev`를 `RoomPanel`까지 포함하도록 갱신:
```tsx
"use client";
import { useState } from "react";
import { findRoom } from "@/lib/homeBook";
import { PopupBook } from "./PopupBook";
import { RoomPanel } from "./RoomPanel";
export function PopupBookDev() {
  const [room, setRoom] = useState<string | null>(null);
  return (
    <PopupBook activeRoom={room} onRoomChange={setRoom}>
      <RoomPanel room={room ? findRoom(room) ?? null : null} onClose={() => setRoom(null)}>
        <p>임시 내용</p>
      </RoomPanel>
    </PopupBook>
  );
}
```
Playwright: 1440×900에서 「사무소」 명패 클릭 → 0.9초 후 스크린샷 → 카메라가 사무소 판 앞까지 들어가고 우측에 패널. URL이 `#room=office`. 「닫기」 → 정면 복귀, 해시 제거. 브라우저 뒤로 가기로도 나감. Esc 동작. 390×844에서 패널이 하단 시트로.
Expected: 전부 동작, 콘솔 에러 0.

- [ ] **Step 6: lint·타입 → 커밋**

Run: `npx eslint src && npx tsc --noEmit`
```bash
git add src/components/home/book src/app/\(home\)/home.css
git commit -m "feat(book): 명패·방 정보 패널·돌리 인·URL 해시"
```

---

### Task 6: 폴백·능력 감지·dynamic import·홈 페이지 통합

**Files:**
- Create: `src/components/home/book/BookFallback.tsx`
- Create: `src/components/home/book/PopupBookLoader.tsx`
- Modify: `src/app/(home)/page.tsx`
- Delete: `src/components/home/book/PopupBookDev.tsx`, `src/components/home/DeskHero.tsx`
- Modify: `src/app/(home)/home.css`
- Create: `public/home/book/cover/cover-still.webp` (임시: 현재 `public/story/poster.webp` 복사)

**Interfaces:**
- Produces: `PopupBookLoader` props `{ panels: Record<string, ReactNode> }` — 서버가 방별 패널 내용을 넣는다. `BookFallback` props 없음.

- [ ] **Step 1: BookFallback**

`src/components/home/book/BookFallback.tsx`:
```tsx
import Link from "next/link";
import { BOOK_ROOMS } from "@/lib/homeBook";

// 3D를 못 켤 때(WebGL 불가·reduced-motion·저사양·saveData) — 표지 정지 이미지 + 8곳 목록. 정보 손실 없음.
export function BookFallback() {
  return (
    <section className="home-book-fallback">
      {/* eslint-disable-next-line @next/next/no-img-element -- LCP 정지 이미지, 최적화 파이프라인 밖 */}
      <img src="/home/book/cover/cover-still.webp" alt="" className="h-auto w-full" width={1600} height={900} />
      <ul className="mx-auto mt-4 grid max-w-3xl grid-cols-2 gap-2 px-4 sm:grid-cols-4">
        {BOOK_ROOMS.map((r) => (
          <li key={r.id}>
            {r.href.startsWith("http") ? (
              <a href={r.href} target="_blank" rel="noreferrer" className="home-card flex min-h-11 items-center px-3 text-sm">
                {r.label}
              </a>
            ) : (
              <Link href={r.href} className="home-card flex min-h-11 items-center px-3 text-sm">
                {r.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
```

- [ ] **Step 2: PopupBookLoader (클라이언트, 능력 감지 → 폴백 or 3D)**

`src/components/home/book/PopupBookLoader.tsx`:
```tsx
"use client";

import dynamic from "next/dynamic";
import { useEffect, useState, type ReactNode } from "react";
import { findRoom } from "@/lib/homeBook";
import { BookFallback } from "./BookFallback";
import { RoomPanel } from "./RoomPanel";

// three 번들은 여기서만 로드 — 홈 외 페이지엔 실리지 않는다
const PopupBook = dynamic(() => import("./PopupBook").then((m) => m.PopupBook), {
  ssr: false,
  loading: () => <BookFallback />,
});

type Nav = Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };

function canRun3d(): boolean {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  const nav = navigator as Nav;
  if (nav.deviceMemory !== undefined && nav.deviceMemory < 2) return false;
  if (nav.connection?.saveData) return false;
  try {
    const c = document.createElement("canvas");
    return Boolean(c.getContext("webgl2") ?? c.getContext("webgl"));
  } catch {
    return false;
  }
}

export function PopupBookLoader({ panels }: { panels: Record<string, ReactNode> }) {
  const [mode, setMode] = useState<"pending" | "3d" | "fallback">("pending");
  const [room, setRoom] = useState<string | null>(null);

  useEffect(() => {
    setMode(canRun3d() ? "3d" : "fallback");
  }, []);

  if (mode !== "3d") return <BookFallback />;
  const def = room ? findRoom(room) ?? null : null;
  return (
    <PopupBook activeRoom={room} onRoomChange={setRoom}>
      <RoomPanel room={def} onClose={() => setRoom(null)}>
        {def ? panels[def.id] : null}
      </RoomPanel>
    </PopupBook>
  );
}
```

- [ ] **Step 3: 홈 페이지 통합 — 방 패널 내용을 서버에서 채움**

`src/app/(home)/page.tsx`:
- import에서 `DeskHero` 제거, 추가: `import { PopupBookLoader } from "@/components/home/book/PopupBookLoader";`
- `return (` 위에 패널 맵 구성:
```tsx
const todayEntries = daySchedule[today] ?? [];
const staffById = new Map(staff.map((s) => [s.id, s]));
const panels: Record<string, React.ReactNode> = {
  office: (
    <p>
      마녀 사장이 이력서 세 장을 심사합니다. 지원자들은 전부 사고를 치고 붙잡혀 감옥에 갇히는데 — 그게 바로 채용이었습니다.
    </p>
  ),
  vault: <p>강시가 훔치려던 돈자루가 있던 곳. 요즘은 요괴 주식 이벤트가 열립니다.</p>,
  street: <p>밤마다 「나라카」 간판이 깜빡입니다. 릴스로 만든 채용 설화를 볼 수 있습니다.</p>,
  house: <p>{HOME_INFO.hoursNote}</p>,
  field: <p>{HOME_INFO.addressLine}</p>,
  jail: (
    <ul className="flex flex-col gap-1">
      {todayEntries.map((e) => {
        const s = staffById.get(e.staffId);
        return s ? <li key={e.id}>{s.name}</li> : null;
      })}
      {todayEntries.length === 0 && <li className="text-[var(--home-sheet-muted)]">오늘 출근표는 아직 안 나왔습니다.</li>}
    </ul>
  ),
  cafe: <p>걸레질·먼지떨이·설거지를 마친 요괴들이 내는 메뉴입니다.</p>,
  plaza: (
    <ul className="flex flex-col gap-1">
      {latest.slice(0, 3).map((p) => (
        <li key={p.id}>
          <Link href={p.type === "event" ? `/events/${p.id}` : `/notice/${p.id}`} className="underline underline-offset-2">
            {p.title}
          </Link>
        </li>
      ))}
      {latest.length === 0 && <li className="text-[var(--home-sheet-muted)]">아직 전할 소식이 없습니다.</li>}
    </ul>
  ),
};
```
- JSX: `<DeskHero />` → 아래로 교체
```tsx
{/* 팝업북 — 표지 정지 이미지를 먼저 그려 LCP 확보, 캔버스는 그 위에 */}
<div className="home-book-hero">
  <PopupBookLoader panels={panels} />
</div>
```
- 하단 태그라인은 `home-book-stage` 안이 아니라 책 구역 바로 아래 기존 달력 섹션 위에 한 줄 추가:
```tsx
<p className="mx-auto max-w-3xl px-4 pt-6 text-center text-sm text-[var(--home-muted)]">{HOME_INFO.tagline}</p>
```

- [ ] **Step 4: 정리**

```bash
git rm src/components/home/book/PopupBookDev.tsx src/components/home/DeskHero.tsx
mkdir -p public/home/book/cover && cp public/story/poster.webp public/home/book/cover/cover-still.webp
grep -rn "DeskHero" src/  # 0건이어야 함
```
`home.css`에 추가:
```css
.home-book-hero {
  position: relative;
}
.home-book-fallback {
  background: var(--home-void);
  padding-bottom: 1rem;
}
```

- [ ] **Step 5: 검증**

Run: `npx eslint src && npx tsc --noEmit && npm run build`
Expected: 빌드 통과. 빌드 출력에서 `/` 외 라우트의 First Load JS가 이전과 같음(three가 홈에만 실림).

Playwright:
- 1440×900 `/` — 3D 열림, 명패 클릭 시 서버가 채운 패널 내용(예: 사무소 문장) 표시
- `browser_evaluate`로 `matchMedia` 우회 대신 Chrome DevTools 에뮬레이션이 없으므로, `PopupBookLoader`에 임시로 `?fallback=1` 쿼리 강제 분기를 넣어 폴백 화면 스크린샷 후 제거
- 390×844 — 명패 하단 정렬, 패널 하단 시트, 가로 스크롤 없음(`document.documentElement.scrollWidth === 390`)

- [ ] **Step 6: 커밋**

```bash
git add -A src public/home/book
git commit -m "feat(book): 폴백·능력 감지·dynamic import + 홈 히어로를 팝업북으로 교체"
```

---

### Task 7: 에셋 파이프라인 스크립트 — 종이 인형 처리·인물 추출

**Files:**
- Create: `scripts/book/paperdoll.py`
- Create: `scripts/book/extract_character.py`
- Create: `scripts/book/PROMPTS.md`

**Interfaces:**
- Produces: `python3 scripts/book/paperdoll.py IN.png OUT.webp [--border 3] [--max 1024]` — 투명 PNG를 받아 흰 종이 테두리·종이 질감·접촉 그림자를 입히고 최대 변 1024로 WebP 저장. `python3 scripts/book/extract_character.py IN.png OUT.png --bbox x0 y0 x1 y1` — 원화에서 지정 영역의 인물을 배경색 팔레트 BFS로 오려내 투명 PNG.

- [ ] **Step 1: paperdoll.py**

`scripts/book/paperdoll.py`:
```python
"""종이 인형 처리 — 투명 컷아웃에 흰 종이 테두리·종이 질감·접촉 그림자를 입혀 WebP로.
무대(앤틱 생성)와 인물(원화)의 결 차이를 같은 처리로 묶는다.
사용: python3 scripts/book/paperdoll.py in.png out.webp [--border 3] [--max 1024] [--no-shadow]
"""
import argparse
import random
from PIL import Image, ImageFilter, ImageChops


def paper_texture(size: tuple[int, int], seed: int = 7) -> Image.Image:
  """약한 종이 결 — 무작위 점 노이즈를 블러한 뒤 밝기 0.92~1.0로 압축."""
  rnd = random.Random(seed)
  w, h = size
  noise = Image.effect_noise((w, h), 48).convert("L")
  noise = noise.filter(ImageFilter.GaussianBlur(0.8))
  # 0.92~1.0 범위로 스케일
  return noise.point(lambda v: int(235 + (v / 255) * 20))


def paperdoll(src: Image.Image, border: int, max_side: int, shadow: bool) -> Image.Image:
  img = src.convert("RGBA")
  if max(img.size) > max_side:
    img.thumbnail((max_side, max_side), Image.LANCZOS)
  # 테두리·그림자 여유
  pad = border + 6
  canvas = Image.new("RGBA", (img.width + pad * 2, img.height + pad * 2), (0, 0, 0, 0))
  canvas.paste(img, (pad, pad), img)
  alpha = canvas.split()[3]

  # 흰 종이 테두리 = 알파를 팽창한 흰 실루엣을 아래 깐다
  dil = alpha.filter(ImageFilter.MaxFilter(border * 2 + 1))
  white = Image.new("RGBA", canvas.size, (246, 240, 226, 255))
  white.putalpha(dil)

  # 종이 질감을 컬러 채널에 곱한다
  tex = paper_texture(canvas.size).convert("RGB")
  rgb = ImageChops.multiply(canvas.convert("RGB"), tex)
  textured = rgb.convert("RGBA")
  textured.putalpha(alpha)

  out = Image.alpha_composite(white, textured)

  if shadow:
    sh_alpha = dil.filter(ImageFilter.GaussianBlur(4)).point(lambda v: int(v * 0.45))
    sh = Image.new("RGBA", canvas.size, (0, 0, 0, 255))
    sh.putalpha(sh_alpha)
    base = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    base.paste(sh, (2, 4), sh)
    out = Image.alpha_composite(base, out)
  return out


def main() -> None:
  ap = argparse.ArgumentParser()
  ap.add_argument("src")
  ap.add_argument("dst")
  ap.add_argument("--border", type=int, default=3)
  ap.add_argument("--max", type=int, default=1024)
  ap.add_argument("--no-shadow", action="store_true")
  a = ap.parse_args()
  out = paperdoll(Image.open(a.src), a.border, a.max, not a.no_shadow)
  out.save(a.dst, "WEBP", quality=88, method=6)
  print(f"{a.dst} {out.width}x{out.height}")


if __name__ == "__main__":
  main()
```

- [ ] **Step 2: extract_character.py**

`scripts/book/extract_character.py`:
```python
"""원화에서 인물 오려내기 — 지정 영역 안에서 배경색 팔레트 BFS로 배경을 지우고, 먹선은 채색면 7px 이내만 남긴다.
릴스 컷아웃 때 확립한 방법(릴스 README 참조). 사용:
  python3 scripts/book/extract_character.py 1.png out.png --bbox 120 300 700 1100 [--tol 28]
"""
import argparse
from collections import deque
from PIL import Image, ImageFilter


def close_colors(a: tuple[int, int, int], b: tuple[int, int, int], tol: int) -> bool:
  return abs(a[0] - b[0]) + abs(a[1] - b[1]) + abs(a[2] - b[2]) <= tol


def extract(img: Image.Image, bbox: tuple[int, int, int, int], tol: int) -> Image.Image:
  crop = img.convert("RGB").crop(bbox)
  w, h = crop.size
  px = crop.load()
  # 배경 팔레트 = 네 모서리 색
  palette = {px[0, 0], px[w - 1, 0], px[0, h - 1], px[w - 1, h - 1]}
  bg = [[False] * w for _ in range(h)]
  q: deque[tuple[int, int]] = deque()
  for x, y in ((0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)):
    q.append((x, y))
    bg[y][x] = True
  while q:
    x, y = q.popleft()
    for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
      if 0 <= nx < w and 0 <= ny < h and not bg[ny][nx] and any(close_colors(px[nx, ny], p, tol) for p in palette):
        bg[ny][nx] = True
        q.append((nx, ny))
  alpha = Image.new("L", (w, h), 255)
  ap = alpha.load()
  for y in range(h):
    for x in range(w):
      if bg[y][x]:
        ap[x, y] = 0
  # 먹선 고아 제거: 채색면(알파 유지)에서 7px 넘게 떨어진 어두운 픽셀은 버린다
  keep = alpha.filter(ImageFilter.MaxFilter(15))
  kp = keep.load()
  for y in range(h):
    for x in range(w):
      if ap[x, y] and kp[x, y] == 0:
        ap[x, y] = 0
  out = crop.convert("RGBA")
  out.putalpha(alpha)
  return out


def main() -> None:
  ap = argparse.ArgumentParser()
  ap.add_argument("src")
  ap.add_argument("dst")
  ap.add_argument("--bbox", type=int, nargs=4, required=True)
  ap.add_argument("--tol", type=int, default=28)
  a = ap.parse_args()
  out = extract(Image.open(a.src), tuple(a.bbox), a.tol)
  out.save(a.dst)
  print(f"{a.dst} {out.width}x{out.height}")


if __name__ == "__main__":
  main()
```

- [ ] **Step 3: 동작 확인 (기존 에셋으로)**

```bash
cd /Users/jefflee/workspace/naraka-home-wt
python3 scripts/book/paperdoll.py public/home/deco/deco-cat.webp /tmp/claude-paperdoll-test.webp
python3 -c "from PIL import Image; im=Image.open('/tmp/claude-paperdoll-test.webp'); print(im.mode, im.size, im.getextrema()[3])"
```
Expected: `RGBA (W+18)x(H+18) (0, 255)` — 알파가 0과 255를 모두 가짐. 이미지를 Read로 열어 흰 테두리·그림자가 보이는지 눈으로 확인.

- [ ] **Step 4: PROMPTS.md (힉스필드 원장)**

`scripts/book/PROMPTS.md`:
````markdown
# 팝업북 무대 에셋 — 힉스필드 프롬프트 원장

모든 무대 에셋 공통 머리말 (STYLE):

```
Antique retro storybook illustration, ink outlines with warm flat painted fills, aged paper texture.
Palette: near-black violet #131117, dark rosewood #3a2a26 and #6b4a44, parchment #d1b89d, cream #e6d4b8,
muted brick red #a34c37 accent, chalk #dfdfdf highlights. Night scene lit by warm orange candle and bulb light.
Single isolated object on a plain flat mid-grey background, no cast shadow outside the object, no text, no border.
Chunky readable shapes, front view, straight-on. Ultra high resolution.
```

생성 후 `remove_background` → `paperdoll.py` → `public/home/book/<면>/<id>.webp`.
글자는 절대 넣지 않는다(간판·명패도 HTML).

## 표지 (cover/)
| id | 프롬프트 (STYLE + ) |
|---|---|
| cover-leather | `a closed antique leather book cover, dark rosewood leather with worn gold corner ornaments, an empty rectangular gold-framed title area in the upper center, a small empty brass nameplate near the bottom` |
| cover-still | (폴백·LCP용) 면 1을 완성한 뒤 Playwright 1600×900 스크린샷으로 대체 |

## 면 1 (p1/) — 프롤로그·1막
| id | 프롬프트 (STYLE + ) |
|---|---|
| p1-sky | `a wide night sky backdrop with a thin crescent moon, soft mist near the bottom, distant rooftop silhouettes, 16:9` |
| p1-ground | `a wide strip of cobblestone street at night with a low stone curb, 4:1 aspect, seamless left to right` |
| p1-office | `a small two-story witch's office building, open front like a dollhouse showing a heavy rosewood desk with three paper scrolls and a red seal stamp, cluttered shelves, a crooked chimney, candle glow in the window` |
| p1-vault | `a squat stone bank vault building with an open round iron door, gold coins and money sacks spilling out, iron bars on a small window` |
| p1-props | `a cluster of small props: a crooked street lamp, a wooden crate, a stack of coins` |
| jail-5 | `a small stone jail cell, open front, iron bars, a wooden bench, five tally marks scratched on the back wall in one group` |

## 면 2 (p2/) — 2막
| id | 프롬프트 (STYLE + ) |
|---|---|
| p2-sky | `a wide night sky backdrop with small bat silhouettes, a few stars, thin clouds, 16:9` |
| p2-ground | `a wide strip of cobblestone street at night, puddles reflecting warm light, 4:1, seamless` |
| p2-street | `a row of three narrow antique shop facades at night with a large empty wooden sign board hanging over the middle door, lanterns, closed shutters` |
| p2-house | `a small crooked witch's cottage, open front like a dollhouse showing a bedroom with a four-poster bed, a nightstand with a candle, a wooden cross hanging on the wall` |
| p2-props | `a cluster of small props: a wooden fence piece, a mailbox on a post, a sleeping black cat silhouette` |
| jail-10 | `a small stone jail cell, open front, iron bars, a wooden bench, ten tally marks scratched on the back wall in two groups of five` |

## 면 3 (p3/) — 3막·피날레
| id | 프롬프트 (STYLE + ) |
|---|---|
| p3-sky | `a wide dusk sky backdrop, deep violet fading to warm amber near the horizon, a few drifting embers, 16:9` |
| p3-ground | `a wide strip of dirt path with grass tufts and pumpkin vines, 4:1, seamless` |
| p3-field | `a pumpkin patch with large orange pumpkins, tangled vines, a wooden scarecrow post, a small wisp of flame on one vine` |
| jail-15 | `a small stone jail cell, open front, iron bars, a low table with playing cards, a teapot, fifteen tally marks scratched on the back wall in three groups of five` |
| p3-cafe | `a two-story antique cafe building, open front like a dollhouse showing a hall with three round tables on the ground floor and a kitchen with a big iron cauldron upstairs, warm light, an empty sign board above the door` |
| p3-plaza | `a small town square corner with a large ornate empty picture frame standing on an easel, a brass nameplate on a short post, cobblestones` |

## 방 내부 겹 (rooms/<room>/) — 방마다 5장
겹 순서: window(창밖) · wall(뒷벽) · furniture(가구) · figure(인물 — 원화, 생성 안 함) · frame(앞 문틀)

공통: `interior layer for a tunnel book, <내용>, flat front view, cut-out shape`
| room | window | wall | furniture | frame |
|---|---|---|---|---|
| office | `night sky through a round window` | `dark wood-panel wall with cluttered shelves of jars and books` | `a heavy rosewood desk with three scrolls, a red seal stamp, an inkwell, a fat sleeping cat on the corner` | `an arched doorway frame of dark wood with a brass plate area left empty` |
| vault | `dark stone` | `stone vault wall with a round iron door ajar` | `sacks of money and a spilling pile of coins and banknotes` | `a heavy iron-banded doorway frame` |
| street | `deep night sky with bats` | `a row of shuttered shop fronts` | `a hanging empty wooden sign board, two lanterns` | `a stone archway frame` |
| house | `moonlit window with curtains` | `bedroom wall with a hanging wooden cross` | `a four-poster bed with rumpled blankets, a nightstand with a candle` | `a cottage doorway frame with a crooked lintel` |
| field | `dusk sky with drifting embers` | `distant rolling hills with a scarecrow` | `large pumpkins and tangled vines, a water cannon on a cart` | `a wooden fence gate frame` |
| jail | `tiny barred window with night sky` | `stone wall with fifteen tally marks in three groups` | `a low table with playing cards, a teapot, a bench` | `iron bars doorway frame` |
| cafe | `warm kitchen glow through a serving hatch` | `cafe wall with a chalkboard area left empty and shelves of cups` | `three round tables with chairs, a counter with a big cauldron` | `a cafe doorway frame with an empty sign board above` |
| plaza | `night sky with a crescent moon` | `stone town-square wall with a lamp` | `a large ornate empty picture frame on an easel, a brass nameplate post` | `a stone archway frame with hanging bunting` |

## 인물·펫 (원화에서 추출 — 생성하지 않는다)
`extract_character.py`로 `~/Desktop/naraka/story/{n}.png`에서 오려낸다. 작가 웹 사용 동의 확인 후.
| id | 원화 | 쓰이는 곳 |
|---|---|---|
| okja-sit | 13 | office figure |
| okja-sleep | 6 | house figure |
| mell-cry | 4 | jail-5, jail figure |
| mell-mop | 14 | cafe figure |
| bana-drool | 6 | house (작게) |
| bana-dust | 15 | cafe figure |
| miho-sing | 9 | field figure |
| miho-dish | 16 | cafe figure |
| ghost-money | 1 | vault figure |
| group | 17 | plaza figure |
| cats | 13 | office (시온·코코) |
````

- [ ] **Step 5: 커밋**

```bash
git add scripts/book
git commit -m "feat(book): 에셋 파이프라인 — 종이 인형 처리·원화 인물 추출 스크립트 + 프롬프트 원장"
```

---

### Task 8: 표지 + 면 1 무대 에셋 생성·적용 (결 확정 관문)

**Files:**
- Create: `public/home/book/cover/cover-leather.webp`, `public/home/book/p1/*.webp`, `public/home/book/rooms/{office,vault}/{window,wall,furniture,frame}.webp`
- Modify: `src/lib/homeBook.ts` (p1·office·vault·jail-5의 `src`), `src/components/home/book/Jail.tsx` (`JAIL_SRC[5]`)

이 Task는 코드보다 MCP 작업이다. 힉스필드 `generate_image_batch` → `jobs_wait` → `show_generation_by_ids` → 다운로드 → `remove_background` → `paperdoll.py`.

- [ ] **Step 1: 배치 생성**

`scripts/book/PROMPTS.md`의 표지 1 + 면 1 6 + office 4 + vault 4 = 15장을 `generate_image_batch`로 한 번에. 모델은 `models_explore(action:'recommend')`로 "flat illustration, isolated object" 추천값. 결과를 `~/Desktop/naraka/book/raw/p1/`에 저장.

- [ ] **Step 2: 결 검수 (한 판 대조)**

```bash
python3 - <<'EOF'
from PIL import Image
import glob
files = sorted(glob.glob('/Users/jefflee/Desktop/naraka/book/raw/p1/*.png'))
thumbs = [Image.open(f).convert('RGB').resize((320, 320)) for f in files]
cols = 5
rows = (len(thumbs) + cols - 1) // cols
sheet = Image.new('RGB', (cols * 320, rows * 320), (40, 40, 40))
for i, t in enumerate(thumbs):
  sheet.paste(t, ((i % cols) * 320, (i // cols) * 320))
sheet.save('/Users/jefflee/Desktop/naraka/book/raw/p1/_sheet.png')
EOF
```
`_sheet.png`를 Read로 열어 검수: 팔레트 일탈·글자 침입·앞면 막힘·결 튐. 튀는 것만 리테이크(§4-4 리테이크 문장 사용). **사장님께 시트를 보여 결 승인** — 이 관문을 통과해야 면 2·3으로 간다.

- [ ] **Step 3: 배경 제거 → 종이 인형 → 배치**

```bash
mkdir -p public/home/book/{cover,p1,rooms/office,rooms/vault}
for f in ~/Desktop/naraka/book/cut/p1/*.png; do
  id=$(basename "$f" .png)
  case "$id" in
    cover-*) out=public/home/book/cover/$id.webp ;;
    office-*) out=public/home/book/rooms/office/${id#office-}.webp ;;
    vault-*) out=public/home/book/rooms/vault/${id#vault-}.webp ;;
    *) out=public/home/book/p1/$id.webp ;;
  esac
  python3 scripts/book/paperdoll.py "$f" "$out" --max 1024
done
du -ch public/home/book/p1/*.webp public/home/book/cover/*.webp | tail -1
```
Expected: 면 1 + 표지 합계 ≤ 1.5MB. 넘으면 `--max 768`로 재실행.

- [ ] **Step 4: homeBook.ts에 src 연결**

`BOOK_PAGES[0].layers`의 각 `src: null` → `"/home/book/p1/p1-sky.webp"` 등. `roomLayers("office", …)` 호출을 방별 src를 받도록 확장:
```ts
const roomLayers = (roomId: string, tint: string, withSrc = false): PaperLayerDef[] => {
  const src = (k: string) => (withSrc ? `/home/book/rooms/${roomId}/${k}.webp` : null);
  return [
    layer(`${roomId}-window`, { src: src("window"), w: 6, h: 4, x: 0, y: 0, z: -2.4, open: 0, duration: 0.01, tint: "#131117" }),
    layer(`${roomId}-wall`, { src: src("wall"), w: 6.4, h: 4.4, x: 0, y: 0, z: -1.8, open: 0, duration: 0.01, tint }),
    layer(`${roomId}-furniture`, { src: src("furniture"), w: 5, h: 3, x: 0, y: 0, z: -1.0, open: 0.5, duration: 0.3, tint: "#3a2a26" }),
    layer(`${roomId}-figure`, { src: null, w: 2.2, h: 2.6, x: -0.8, y: 0, z: -0.4, open: 0.7, duration: 0.3, tint: "#d1b89d" }),
    layer(`${roomId}-frame`, { src: src("frame"), w: 7, h: 5, x: 0, y: 0, z: 0, open: 0.3, duration: 0.3, tint: "#6b4a44" }),
  ];
};
```
office·vault는 `roomLayers("office", "#6b4a44", true)`. 판 `w`/`h`는 실제 이미지 비율에 맞게 조정(비율 = 이미지 w/h, 높이를 기준으로). `Jail.tsx`의 `JAIL_SRC[5] = "/home/book/p1/jail-5.webp"`.

- [ ] **Step 5: 브라우저 검증 + 표지 정지 이미지 교체**

Playwright 1440×900: 로드 직후·1.5초 후·「사무소」 진입 스크린샷. 겹 사이 시차가 보이는지(카메라 이동 중 앞 문틀이 뒷벽보다 빨리 움직임). 면 1 완성 상태를 1600×900으로 찍어 `public/home/book/cover/cover-still.webp`로 교체(임시 poster 대체).

- [ ] **Step 6: 테스트·lint → 커밋**

```bash
npx vitest run && npx eslint src && npx tsc --noEmit
git add public/home/book src/lib/homeBook.ts src/components/home/book/Jail.tsx
git commit -m "feat(book): 표지·면 1 무대 에셋 적용 (사무소·금고·감옥 5)"
```

---

### Task 9: 면 2·3 무대 에셋 + 나머지 방 내부

**Files:**
- Create: `public/home/book/p2/*.webp`, `public/home/book/p3/*.webp`, `public/home/book/rooms/{street,house,field,jail,cafe,plaza}/*.webp`
- Modify: `src/lib/homeBook.ts`, `src/components/home/book/Jail.tsx`

- [ ] **Step 1: 생성** — Task 8 Step 1과 같은 방법으로 면 2(6) + 면 3(6) + 방 6×4 = 36장. 한 판 대조 시트로 검수, 튀는 것만 리테이크.
- [ ] **Step 2: 처리·배치** — Task 8 Step 3과 같은 루프를 p2·p3·rooms에.
- [ ] **Step 3: src 연결** — `BOOK_PAGES[1..2]`, 나머지 방 `roomLayers(..., true)`, `JAIL_SRC[10]`, `JAIL_SRC[15]`.
- [ ] **Step 4: 프리로드** — `PopupBook.tsx`에 다음 면 텍스처 프리로드 추가(면 전환 직전에 로드):
```tsx
import { useTexture } from "@react-three/drei";
// 면 전환 구간에 들어가면 다음 면 텍스처를 미리 받는다
useEffect(() => {
  const next = BOOK_PAGES[scroll.page + 1];
  if (!next) return;
  const srcs = [
    ...next.layers.map((l) => l.src),
    ...roomsOfPage(next.id).flatMap((r) => r.layers.map((l) => l.src)),
  ].filter((s): s is string => Boolean(s));
  useTexture.preload(srcs);
}, [scroll.page]);
```
(`roomsOfPage` import 추가)
- [ ] **Step 5: 검증** — 1440×900·390×844에서 면 1→2→3 전환 스크린샷, 방 8곳 진입 전부 확인. 네트워크 탭에서 초기 로드에 p2·p3 텍스처가 없고 전환 구간에서 받는지 확인.
- [ ] **Step 6: 커밋**

```bash
git add public/home/book src/lib/homeBook.ts src/components/home/book
git commit -m "feat(book): 면 2·3 무대 에셋 + 방 내부 6곳 + 다음 면 프리로드"
```

---

### Task 10: 인물·펫 컷아웃 (작가 동의 후)

**전제:** 사장님이 작가 웹 사용 동의를 확인했다고 알려준 뒤에만 진행. 그 전엔 `figure` 겹이 `src: null`(단색 실루엣 판)로 남는다.

**Files:**
- Create: `public/home/book/figures/*.webp`
- Modify: `src/lib/homeBook.ts` (figure 겹 src)

- [ ] **Step 1: bbox 잡기** — 원화 `~/Desktop/naraka/story/{n}.png`를 Read로 열어 인물 영역 좌표를 정한다(캐러셀 UI가 구워진 상단·하단 띠는 bbox에서 제외).
- [ ] **Step 2: 추출·처리**
```bash
mkdir -p ~/Desktop/naraka/book/figures public/home/book/figures
python3 scripts/book/extract_character.py ~/Desktop/naraka/story/13.png ~/Desktop/naraka/book/figures/okja-sit.png --bbox X0 Y0 X1 Y1
python3 scripts/book/paperdoll.py ~/Desktop/naraka/book/figures/okja-sit.png public/home/book/figures/okja-sit.webp --max 768
```
PROMPTS.md 인물 표의 11개를 같은 방식으로.
- [ ] **Step 3: 연결** — `roomLayers`에 `figureSrc?: string` 인자를 추가해 방별 figure 겹 src를 넣는다. 인물 판 `w`/`h`는 이미지 비율대로, 높이는 방 높이의 1/2 이하.
- [ ] **Step 4: 검증** — 8방 진입 스크린샷. 흰 테두리·그림자가 무대와 같은 처리로 보이는지(종이 인형 문법). 캐러셀 UI 조각이 남아 있지 않은지.
- [ ] **Step 5: 커밋**

```bash
git add public/home/book/figures src/lib/homeBook.ts
git commit -m "feat(book): 원화 인물·펫 컷아웃 배치 (종이 인형 처리)"
```

---

### Task 11: 마감 검증 — 실기기·Lighthouse·접근성·문안

**Files:**
- Modify: 발견되는 것만

- [ ] **Step 1: 문안 금지 어휘**
```bash
grep -rn -P "저승|이승|천계|명계|명부|도깨비(?!불)|옥황|염라|원혼|혼령|혼백|영혼|삼도천|환생|상여|성불|극락" src/lib/homeBook.ts "src/app/(home)/page.tsx" src/components/home/book; echo "exit=$?"
```
Expected: 0건 (`exit=1`)
- [ ] **Step 2: 이모지** — `grep -rnP "[\x{1F300}-\x{1FAFF}\x{2600}-\x{27BF}]" src/components/home/book src/lib/homeBook.ts` → 0건
- [ ] **Step 3: 접근성** — 키보드만으로 Tab → 명패 8개 순서(스토리 순) → Enter 진입 → 포커스가 「닫기」로 → Esc → 포커스 명패 복귀. 스크린리더 관점: 캔버스 `aria-hidden`, 패널 `role=dialog`·제목 연결.
- [ ] **Step 4: Lighthouse 모바일** — `npx lighthouse http://localhost:3000/ --preset=mobile --only-categories=performance,accessibility --output=json --output-path=/tmp/claude-lh.json --chrome-flags="--headless"` (워치독: `( cmd & pid=$!; ( sleep 180; kill -9 $pid 2>/dev/null ) & wd=$!; wait $pid; kill $wd 2>/dev/null )`). 확인: LCP ≤ 2.5s, CLS 0, 접근성 ≥ 95. LCP 요소가 `cover-still.webp`인지.
- [ ] **Step 5: 실기기** — 사장님 iPhone·Android에서 `npm run dev` LAN 주소로: 열림 60fps 체감, 면 전환 끊김, 명패 터치. 결과를 사장님이 알려주면 DPR·텍스처 크기 조정.
- [ ] **Step 6: 빌드·전체 테스트**
```bash
npx vitest run && npx eslint src && npx tsc --noEmit && npm run build
```
- [ ] **Step 7: 스크린샷 세트 저장** — 390×844·1440×900 × {표지 직후, 면 1, 면 2, 면 3, 사무소 진입, 감옥 진입, 폴백} 14장을 `docs/design-refs/popup-book/`에. 사장님 컨펌용.
- [ ] **Step 8: 커밋 + PR #80 갱신**
```bash
git add -A
git commit -m "test(book): 팝업북 마감 검증 — 접근성·Lighthouse·스크린샷 세트"
git push
```
PR #80 본문에 스크린샷 세트와 "8/31 이후 병합" 유지.

---

## 자체 검토

- **스펙 커버리지**: §2 구조(Task 1·4), §2-1 매핑(Task 1 `BOOK_ROOMS`·Task 6 panels), §3-1 스크롤(Task 2·4), §3-2 돌리 인·터널북·해시(Task 3·5), §3-3 첫 화면·상단 바 유지(Task 6 — `HomeHeader`는 손대지 않음), §3-4 모바일(Task 3 portrait·Task 5 하단 시트), §4 에셋·종이 인형·파이프라인(Task 7~10), §4-4 작가 동의 게이트(Task 10), §5-3 예산(Task 6 dynamic·Task 8 1.5MB·Task 9 프리로드), §5-4 폴백·접근성(Task 6·11), §6 검증(Task 11).
- **누락 의도**: 정지 상태의 판 "호흡" 애니(±0.3°)는 스펙에 있으나 성능 검증 전엔 넣지 않는다 — Task 11 실기기 결과가 60fps면 `PaperLayer`에 `useFrame`으로 3줄 추가(별도 커밋). 데스크톱 마우스 ±2° 시차도 같은 조건.
- **타입 일관성**: `PaperLayerDef.src: string | null`, `layerOpen(def, pageOpen)`, `pageOffsetX`, `roomCamera(room, pageIndex)`, `PopupBook{activeRoom,onRoomChange,children}`, `RoomPanel{room,onClose,children}`, `PopupBookLoader{panels}` — Task 간 동일.
- **함정 메모**: Next 16에서 `dynamic(..., { ssr: false })`는 클라이언트 컴포넌트 안에서만 허용 → `PopupBookLoader`가 그 역할. drei `Html`은 DOM 포털이라 명패 버튼이 실제 접근 가능. `useTexture`는 Suspense 필요 → `PaperLayer`에서 감쌈.
