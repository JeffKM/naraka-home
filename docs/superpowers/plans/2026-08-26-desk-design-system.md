# "옥자의 책상" 디자인 시스템 + 구성 개편 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 카페 홈 디자인 시스템을 릴스 실측 팔레트 "옥자의 책상"으로 전면 교체하고, 설화를 /about에 통합하며, 영상 발췌 장식물 라이브러리를 구축한다.

**Architecture:** 중립 토큰(--home-ink·muted·surface·line·bg·cream)은 이름 유지+값 교체, 브랜드 토큰(gold·amber·teal·oak·burgundy·stage)은 새 이름으로 sed 일괄 리네임. 면 컴포넌트(.home-paper/.home-card/.home-frame)가 내부 텍스트 변수를 시트 잉크로 재정의해 다크 바탕 위 밝은 텍스트 / 시트 위 어두운 텍스트를 스코프로 해결. 장식물은 ffmpeg 프레임 + 경계색 팔레트 BFS 컷아웃 파이프라인.

**Tech Stack:** TailwindCSS v4 + CSS 변수, Next.js 16 서버 컴포넌트, Python PIL/ffmpeg(추출).

**스펙:** `docs/superpowers/specs/2026-08-26-desk-design-system-design.md`

## Global Constraints

- 작업 위치: `/Users/jefflee/workspace/naraka-home-wt` (feat/naraka-home).
- 적용 범위는 (home) 카페 홈 라우트만 — /event·/admin 무변경.
- UI 문구 이모지 금지, 코드 주석·커밋 한국어, TS strict, 게이트 `npm run build`+`npx eslint src`.
- 원화 스타일 "흉내" 금지 — 실측 색·실에셋만 (스펙 §1).
- 실측 팔레트는 스펙 §2 표의 값을 그대로 사용.
- 영상 소스: `~/Desktop/naraka/reels/07-ae/naraka_reels_fianl.mp4` (1080×1920, 24fps).
- 각 태스크 종료 시 build+lint 통과 후 커밋.

---

### Task 1: 토큰 팔레트 교체 + 리네임 스윕

**Files:**
- Modify: `src/app/(home)/home.css` (전면 재작성)
- Modify(sed 스윕): `src/**/*.tsx` 중 구토큰 참조 12파일

**Interfaces:**
- Produces: 신규 토큰 `--home-void/-bar/-rosewood/-rosewood-deep/-red/-red-deep/-heart/-chalk/-slate/-wisp/-wisp-pale/-moss/-parchment/-sheet-ink/-sheet-muted`, 유지 토큰 `--home-bg/-ink/-muted/-surface/-cream/-paper-deep/-line/-noise`(값 교체), 클래스 `.home-chrome`(구 .home-wood), `.home-frame`(구 .home-wood-frame), `.home-rule`(구 .home-gold-line), `.home-plate`(신설). 이후 태스크 전부 이 이름을 사용.

- [ ] **Step 1: home.css 전면 재작성**

기존 파일을 아래 내용으로 교체한다 (구조·클래스 골격은 유지, 값·이름 교체):

```css
/* 카페 홈 디자인 시스템 — "옥자의 책상" (밤의 책상 × 이력서 양피지 × 백묵 명패 × 옥자 레드)
   레퍼런스: 릴스 최종본 실측 팔레트 (2026-08-26 스펙 §2)
   규칙: 페이지 바탕=밤의 책상(잉크 다크), 콘텐츠 면=이력서 양피지(내부 텍스트는 시트 잉크로 재정의),
   섹션 라벨=백묵 명패, 주 CTA=옥자 레드. 위스프 블루는 포커스 링·초자연 포인트에만 아껴 쓴다. */
.home-scope {
  --home-noise: url("data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20width='140'%20height='140'%3E%3Cfilter%20id='n'%3E%3CfeTurbulence%20type='fractalNoise'%20baseFrequency='0.8'%20numOctaves='2'%20stitchTiles='stitch'/%3E%3CfeColorMatrix%20type='saturate'%20values='0'/%3E%3C/filter%3E%3Crect%20width='140'%20height='140'%20filter='url(%23n)'%20opacity='0.06'/%3E%3C/svg%3E");
  --home-void: #0d0c11;          /* 인스타 최외곽 — 최심부 배경 */
  --home-bar: #16151c;           /* 인스타 상·하단 바 — 크롬 */
  --home-bg: #131117;            /* 밤의 책상 바탕 */
  --home-rosewood: #6b4a44;      /* 책상 목재 */
  --home-rosewood-deep: #3a2a26;
  --home-parchment: #d1b89d;     /* 이력서 종이 */
  --home-cream: #e6d4b8;
  --home-surface: #e6d4b8;       /* 시트 위 카드·달력 칸 */
  --home-paper-deep: #c3a988;
  --home-ink: #ddd8d0;           /* 다크 바탕 기본 텍스트 (시트 안에서 재정의됨) */
  --home-muted: #9a938c;
  --home-sheet-ink: #2a2119;     /* 시트 위 잉크 텍스트 */
  --home-sheet-muted: #6e5c49;
  --home-red: #a34c37;           /* 옥자 레드 — 주 CTA */
  --home-red-deep: #7d3728;
  --home-heart: #e54f5b;         /* 인스타 하트 — 마이크로 액센트 */
  --home-chalk: #dfdfdf;         /* 백묵 */
  --home-slate: #515151;         /* 명패 블랙보드 */
  --home-wisp: #8fd0e8;          /* 위스프 코어(포커스 링 대비 보정) */
  --home-wisp-pale: #dff5fd;
  --home-moss: #757f70;          /* 초록 책 — 보조 액센트 */
  --home-line: #b39a76;          /* 양피지 괘선 */
  background:
    var(--home-noise),
    radial-gradient(120% 70% at 50% 100%, rgba(107, 74, 68, 0.32), transparent 60%),
    radial-gradient(140% 80% at 50% 0%, rgba(13, 12, 17, 0.9), transparent 70%),
    var(--home-bg);
  color: var(--home-ink);
  font-family: var(--font-gowun), "Apple SD Gothic Neo", sans-serif;
}
.home-scope a {
  color: inherit;
}

/* 타이포 위계: Hahmlet(제목·UI) → Gowun Dodum(본문) → Gaegu(손글씨·백묵) — 유지 */
.home-scope h1,
.home-scope h2 {
  font-family: var(--font-hahmlet), serif;
  letter-spacing: -0.01em;
}
.home-serif {
  font-family: var(--font-hahmlet), serif;
}
.home-ui {
  font-family: var(--font-hahmlet), serif;
  font-weight: 600;
  letter-spacing: 0.01em;
}
.home-hand {
  font-family: var(--font-gaegu), cursive;
}
.home-tally {
  font-family: var(--font-gaegu), cursive;
  letter-spacing: 3px;
  color: var(--home-muted);
}

/* 잉크 크롬 — 헤더·푸터 공용 (인스타 바 실측 톤, 평면+헤어라인) */
.home-chrome {
  --home-ink: var(--home-chalk);
  --home-muted: #9a938c;
  --home-red: #c0654e;
  background:
    var(--home-noise),
    linear-gradient(180deg, #1a1920, var(--home-bar));
  color: var(--home-chalk);
  border-color: rgba(223, 223, 223, 0.14);
}

/* 상단 몰딩 — 가는 잉크 바 + 옥자 레드 헤어라인 */
.home-curtain {
  height: 6px;
  background: linear-gradient(180deg, #1a1920, var(--home-bar));
  border-bottom: 1px solid var(--home-red);
}

/* 양피지 카드 — 시트 안팎 공용. 내부 텍스트는 시트 잉크 */
.home-card {
  --home-ink: var(--home-sheet-ink);
  --home-muted: var(--home-sheet-muted);
  --home-red: #a34c37;
  border: 1px solid #a98f6b;
  border-radius: 10px;
  background:
    var(--home-noise),
    linear-gradient(180deg, #ecdcc0, #dcc5a6);
  color: var(--home-sheet-ink);
  box-shadow:
    inset 0 0 0 1px rgba(255, 246, 226, 0.5),
    inset 0 0 18px rgba(120, 90, 50, 0.14),
    0 2px 6px rgba(6, 5, 8, 0.4);
}

/* 버튼 — 기본은 명패(블랙보드+백묵), 주 CTA는 옥자 레드 */
.home-btn {
  font-family: var(--font-hahmlet), serif;
  font-weight: 600;
  border: 1px solid #2e2e2e;
  border-radius: 8px;
  background: linear-gradient(180deg, #5c5c5c, #464646);
  color: #e8e8e8;
  box-shadow:
    inset 0 1px 0 rgba(223, 223, 223, 0.25),
    0 2px 4px rgba(6, 5, 8, 0.5);
  transition: filter 0.1s, transform 0.1s, box-shadow 0.1s;
}
.home-btn:hover {
  filter: brightness(1.1);
}
.home-btn:active {
  transform: translateY(1px);
  box-shadow:
    inset 0 1px 0 rgba(223, 223, 223, 0.25),
    0 1px 2px rgba(6, 5, 8, 0.5);
}
.home-btn:focus-visible {
  outline: 3px solid var(--home-wisp);
  outline-offset: 2px;
}
.home-btn-primary {
  background: linear-gradient(180deg, #b0543e, #a34c37 55%, #7d3728);
  color: #f3e6d4;
  border: 1px solid #5f2a1e;
  text-shadow: 0 1px 2px rgba(60, 15, 8, 0.5);
  box-shadow:
    inset 0 1px 0 rgba(240, 200, 170, 0.3),
    0 2px 5px rgba(6, 5, 8, 0.5);
}
.home-btn-primary:active {
  box-shadow:
    inset 0 1px 0 rgba(240, 200, 170, 0.3),
    0 1px 2px rgba(6, 5, 8, 0.5);
}
@media (prefers-reduced-motion: reduce) {
  .home-btn {
    transition: none;
  }
}

/* 명패 라벨 — 섹션 제목용 블랙보드+백묵 (@naraka_concafe 명패 실측 문법) */
.home-plate {
  display: inline-block;
  font-family: var(--font-gaegu), cursive;
  background: linear-gradient(180deg, #565656, #454545);
  color: #e8e8e8;
  border: 1px solid #2b2b2b;
  border-radius: 6px;
  padding: 1px 14px 3px;
  transform: rotate(-1deg);
  box-shadow:
    inset 0 0 0 1px rgba(223, 223, 223, 0.14),
    0 2px 4px rgba(6, 5, 8, 0.45);
}

/* 태그 — 밀랍 인장 칩 (색은 사용처에서 bg로 지정) — 유지 */
.home-tag {
  font-family: var(--font-hahmlet), serif;
  font-weight: 600;
  border: 1px solid rgba(30, 24, 18, 0.55);
  border-radius: 999px;
  transform: rotate(-2deg);
  display: inline-block;
  box-shadow: 0 1px 2px rgba(6, 5, 8, 0.35);
}

/* 구분 괘선 — 로즈우드 그라데이션 (구 골드 라인) */
.home-rule {
  height: 2px;
  width: 64px;
  border-radius: 2px;
  background: linear-gradient(90deg, transparent, var(--home-rosewood) 25%, #8d6a5f 50%, var(--home-rosewood) 75%, transparent);
}

/* 로즈우드 액자 — 달력 등 콘텐츠 프레임 (책상 목재 실측 톤). 내부는 시트 잉크 */
.home-frame {
  --home-ink: var(--home-sheet-ink);
  --home-muted: var(--home-sheet-muted);
  border-radius: 12px;
  padding: 10px;
  background:
    var(--home-noise),
    linear-gradient(180deg, #7a544d, var(--home-rosewood) 40%, var(--home-rosewood-deep));
  box-shadow:
    inset 0 0 0 2px rgba(223, 223, 223, 0.18),
    inset 0 0 0 5px #2c201d,
    0 4px 10px rgba(6, 5, 8, 0.5);
}

/* 레드 패널 — 선택일 상세 등 강조 오버레이 (옥자 레드 실측 톤) */
.home-lacquer-panel {
  --home-ink: #f3e6d4;
  --home-muted: #e0bfa8;
  --home-red: #f3d9a6;
  border: 1px solid #4a2016;
  border-radius: 10px;
  background:
    var(--home-noise),
    radial-gradient(120% 100% at 50% 0%, #b0543e, #8d4030 70%);
  color: #f3e6d4;
  box-shadow:
    inset 0 0 0 2px rgba(240, 220, 190, 0.35),
    inset 0 0 24px rgba(50, 12, 6, 0.5),
    0 3px 8px rgba(6, 5, 8, 0.5);
}

/* 도장 — "확정·채용·완료" 상태 전용 — 유지 */
.home-stamp {
  display: inline-grid;
  place-items: center;
  border: 3px solid var(--home-red-deep);
  color: var(--home-red-deep);
  border-radius: 50%;
  font-family: var(--font-hahmlet), serif;
  font-weight: 600;
  transform: rotate(-8deg);
}

/* 장식 애니메이션 — 유지 */
.home-hang {
  animation: home-sway 7s ease-in-out infinite;
  transform-origin: top center;
}
.home-hang::before {
  content: "";
  display: block;
  width: 2.5px;
  height: 64px;
  margin: 0 auto;
  background: #55403a;
}
@keyframes home-sway {
  0%, 100% { transform: rotate(-1.5deg); }
  50% { transform: rotate(1.8deg); }
}
.home-wisp-float {
  animation: home-wisp 5s ease-in-out infinite;
}
@keyframes home-wisp {
  0%, 100% { transform: translateY(0); opacity: 0.85; }
  50% { transform: translateY(-9px); opacity: 1; }
}
@media (prefers-reduced-motion: reduce) {
  .home-hang,
  .home-wisp-float {
    animation: none;
  }
}

/* 이력서 시트 — 콘텐츠 뭉치마다 양피지 한 장 (불규칙 모서리+얼룩 유지, 실측 종이색). 내부는 시트 잉크 */
.home-paper {
  --home-ink: var(--home-sheet-ink);
  --home-muted: var(--home-sheet-muted);
  --home-red: #a34c37;
  position: relative;
  background:
    var(--home-noise),
    radial-gradient(120% 90% at 22% 0%, rgba(240, 224, 196, 0.85), transparent 55%),
    radial-gradient(80% 70% at 88% 94%, rgba(130, 96, 52, 0.22), transparent 60%),
    radial-gradient(38% 30% at 92% 6%, rgba(124, 90, 48, 0.16), transparent 70%),
    radial-gradient(30% 22% at 6% 78%, rgba(124, 92, 50, 0.14), transparent 70%),
    linear-gradient(180deg, #dcc5a6, #cbb190);
  border: 1px solid #9c8261;
  border-radius: 14px 90px 16px 70px / 70px 15px 80px 14px;
  color: var(--home-sheet-ink);
  box-shadow:
    inset 0 0 0 1px rgba(250, 240, 218, 0.5),
    inset 0 0 34px rgba(110, 82, 44, 0.2),
    0 3px 10px rgba(6, 5, 8, 0.5);
}
.home-paper-tilt {
  transform: rotate(-0.4deg);
}
/* 테이프 조각 — 유지, 양피지 톤 */
.home-tape::before {
  content: "";
  position: absolute;
  top: -11px;
  left: 50%;
  width: 92px;
  height: 24px;
  transform: translateX(-50%) rotate(-2deg);
  background: rgba(210, 184, 140, 0.6);
  border: 1px solid rgba(120, 90, 50, 0.35);
  box-shadow: 0 1px 2px rgba(6, 5, 8, 0.2);
}
```

- [ ] **Step 2: tsx 리네임 스윕**

(home) 스코프의 12개 파일 대상. 긴 이름 먼저(부분 일치 오염 방지):

```bash
cd /Users/jefflee/workspace/naraka-home-wt
grep -rl -- "--home-burgundy\|--home-gold\|--home-amber\|--home-teal\|--home-stage\|home-wood\|home-gold-line" src --include='*.tsx' | while read f; do
  sed -i '' \
    -e 's/--home-burgundy-deep/--home-red-deep/g' \
    -e 's/--home-burgundy/--home-red/g' \
    -e 's/--home-gold-deep/--home-rosewood/g' \
    -e 's/--home-gold/--home-chalk/g' \
    -e 's/--home-amber/--home-chalk/g' \
    -e 's/--home-teal/--home-wisp/g' \
    -e 's/--home-stage/--home-void/g' \
    -e 's/home-wood-frame/home-frame/g' \
    -e 's/home-wood/home-chrome/g' \
    -e 's/home-gold-line/home-rule/g' \
    "$f"
done
```

- [ ] **Step 3: 잔존 참조 0 확인**

Run: `grep -rn -- "--home-gold\|--home-amber\|--home-teal\|--home-oak\|--home-stage\|--home-burgundy\|home-wood\|home-gold-line\|home-lacquer\b" src | grep -v home.css | grep -v "home-lacquer-panel" || echo "잔존 0"`
Expected: `잔존 0` (home.css 안에도 gold/amber/teal/oak/stage/burgundy 정의가 없어야 함 — Step 1에서 제거됨).

- [ ] **Step 4: 게이트 + 홈 스크린샷 QC**

Run: `npm run build && npx eslint src`
dev 서버(3000, 상주 중)로 Playwright 홈 데스크톱/모바일 스크린샷 — 다크 바탕 위 chalk 텍스트, 시트 위 잉크 텍스트, 깨진 대비 없는지 확인. 발견 즉시 수정.

- [ ] **Step 5: 커밋**

```bash
git add "src/app/(home)/home.css" src
git commit -m "feat: 디자인 시스템 3차 교체 — 옥자의 책상 (릴스 실측 팔레트·잉크 크롬·명패 버튼)"
```

---

### Task 2: 크롬 디테일 + 명패 라벨 적용

**Files:**
- Modify: `src/components/home/HomeHeader.tsx` (로고 점 heart 액센트, border 토큰)
- Modify: `src/app/(home)/page.tsx`, `src/components/home/StoryTeaser.tsx`, `src/components/home/CalendarSection.tsx` (섹션 h2에 `.home-plate`)

**Interfaces:**
- Consumes: Task 1의 `.home-plate`, `--home-heart`.

- [ ] **Step 1: 헤더 로고 점을 하트 레드로**

HomeHeader.tsx에서 (Task 1 스윕 후 `text-[var(--home-wisp)]`가 된) 로고 점 span을:

```tsx
<span className="text-[var(--home-heart)]">.</span>
```

헤더 border는 `border-b border-[color:rgba(223,223,223,0.14)]`로 (구 골드 2px 대체 — .home-chrome의 border-color를 쓰도록 `border-b-2 border-[var(--home-chalk)]` 흔적이 남았으면 `border-b` 단독으로 교체).

- [ ] **Step 2: 섹션 제목 명패화**

홈 페이지의 "새 소식", StoryTeaser의 "나라카 채용 설화", CalendarSection의 달력 제목 h2에 클래스 추가: `<h2 className="home-plate text-xl font-semibold">…</h2>` (기존 클래스 유지+home-plate 선행). 시각 확인 후 어색한 곳은 제외 가능 — 최소 홈 2곳(새 소식·설화 티저)은 적용.

- [ ] **Step 3: 게이트 + 커밋**

Run: `npm run build && npx eslint src`

```bash
git add src
git commit -m "feat: 잉크 크롬 디테일 — 하트 로고 점·명패 섹션 라벨"
```

---

### Task 3: /about 재구성 (설화 통합) + /story 삭제

**Files:**
- Modify: `src/app/(home)/about/page.tsx` (전면 재작성)
- Delete: `src/app/(home)/story/page.tsx`
- Modify: `src/components/home/HomeHeader.tsx` (HOME_NAV에서 "설화" 제거)
- Modify: `src/components/home/StoryTeaser.tsx` (href `/story` → `/about`)

**Interfaces:**
- Consumes: `/story/naraka-story.mp4`·`poster.webp`·`insta-frame.webp`·`comic/01~17.webp` (기존 에셋 — 경로 유지, 라우트만 삭제), `HOME_INFO`, `HomeDeco`.

- [ ] **Step 1: about/page.tsx 전면 재작성**

```tsx
import { HomeDeco } from "@/components/home/HomeDeco";
import type { Metadata } from "next";
import { HOME_INFO } from "@/lib/homeConfig";

export const metadata: Metadata = {
  title: "소개",
  description: "나라카 이야기 — 지옥이자 감옥이자 직장인 카페, 그리고 세 번의 채용",
};

// 등장 요괴 — 채용 설화 3막(이력서→욕망→행동→응징→감옥→도장)을 인물 카드에 통합
const CAST = [
  {
    name: "옥자",
    role: "마녀 · 나라카의 주인",
    desc: "한 번도 화내지 않는다. 노려보고, 응징하고, 도장을 찍을 뿐이다.",
  },
  {
    name: "멜",
    role: "1막 · 강시",
    desc: "돈 이야기에 눈이 커진다. 금고를 노리다 발차기에 붙잡혀 걸레를 쥐었다. 도장 — 종신.",
  },
  {
    name: "바나",
    role: "2막 · 뱀파이어",
    desc: "갈증을 참지 못하고 남의 창가에 숨어들다 십자가에 쫓겨 먼지떨이를 쥐었다. 도장 — 종신.",
  },
  {
    name: "미호",
    role: "3막 · 구미호",
    desc: "본인만 모른 채 불을 내고 물대포를 맞은 뒤 수세미를 쥐었다. 도장 — 종신.",
  },
] as const;

const COMIC_COUNT = 17;

export default function AboutPage() {
  return (
    <>
      <HomeDeco />
      <main className="mx-auto max-w-3xl px-4 py-10">
        <div className="home-paper p-5 sm:p-8">
          <h1 className="text-2xl font-bold">나라카 이야기</h1>
          <p className="mt-4 leading-7">
            나라카(奈落)는 지옥을 뜻합니다. 이 카페는 지옥이고, 감옥이고, 직장입니다.
            셋은 같은 곳입니다 — 그게 이 가게의 유일한 농담이자 전부입니다.
          </p>
          <p className="mt-2 leading-7 text-[var(--home-muted)]">
            마녀 사장이 이력서 세 장을 심사했습니다. 지원자들은 전부 사고를 치고
            붙잡혀 감옥에 갇혔는데 — 그게 바로 채용이었습니다.
          </p>

          <div className="mx-auto mt-6 w-full max-w-[420px]">
            {/* 모바일: 9:16 풀폭 플레이어 */}
            <video
              className="w-full rounded-lg sm:hidden"
              controls
              playsInline
              preload="none"
              poster="/story/poster.webp"
              src="/story/naraka-story.mp4"
              aria-label="나라카 채용 설화 애니메이션"
            />
            {/* 데스크톱: 인스타 프레임 목업 안 재생 */}
            <div className="relative hidden aspect-[9/16] sm:block">
              <video
                className="absolute left-[10.19%] top-[8.13%] h-[79.64%] w-[79.63%] object-cover"
                controls
                preload="none"
                poster="/story/poster.webp"
                src="/story/naraka-story.mp4"
                aria-label="나라카 채용 설화 애니메이션"
              />
              {/* eslint-disable-next-line @next/next/no-img-element -- 설화 에셋 */}
              <img
                src="/story/insta-frame.webp"
                alt=""
                className="pointer-events-none absolute inset-0 size-full"
              />
            </div>
          </div>

          <h2 className="home-plate mt-10 text-xl font-bold">요괴들</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {CAST.map((c) => (
              <div key={c.name} className="home-card p-4">
                <p className="font-semibold">{c.name}</p>
                <p className="text-xs text-[var(--home-red)]">{c.role}</p>
                <p className="mt-2 text-sm text-[var(--home-muted)]">{c.desc}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm leading-6 text-[var(--home-muted)]">
            붙잡히는 것이 곧 채용 — 감옥은 직원 휴게실이고, 벽의 형기 빗금은
            근속이 됩니다. 오늘도 요괴들이 손님을 맞이합니다.
          </p>

          <h2 className="home-plate mt-10 text-xl font-bold">원화 컷</h2>
          <div className="scrollbar-none -mx-4 mt-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4">
            {Array.from({ length: COMIC_COUNT }, (_, i) => (
              // eslint-disable-next-line @next/next/no-img-element -- 설화 원화
              <img
                key={i}
                src={`/story/comic/${String(i + 1).padStart(2, "0")}.webp`}
                alt={`채용 설화 원화 ${i + 1}번`}
                loading="lazy"
                className="w-4/5 max-w-[360px] shrink-0 snap-center rounded-lg border border-[var(--home-line)]"
              />
            ))}
          </div>

          <div className="mt-8 text-center">
            <a
              href={HOME_INFO.instagramUrl}
              target="_blank"
              rel="noreferrer"
              className="home-btn home-btn-primary px-5 py-2"
            >
              instagram @{HOME_INFO.instagramHandle}
            </a>
          </div>
        </div>
      </main>
    </>
  );
}
```

- [ ] **Step 2: /story 삭제 + 내비·티저 정리**

```bash
git rm -r "src/app/(home)/story"
```

HomeHeader.tsx의 HOME_NAV에서 `{ href: "/story", label: "설화" },` 줄 삭제.
StoryTeaser.tsx의 `href="/story"` → `href="/about"`, aria-label은 "채용 설화 보러 가기"로.

- [ ] **Step 3: 게이트 + 커밋**

Run: `npm run build && npx eslint src` — 빌드 라우트에 /story 부재·/about 존재 확인.

```bash
git add src
git commit -m "feat: 설화를 소개 페이지로 통합 — /story 삭제·내비 정리"
```

---

### Task 4: 영상 장식물 컷아웃 추출

**Files:**
- Create: `scripts/extract-video-deco.py`
- Create(생성물): `public/home/deco/video/v-*.webp` (12종 이상)

**Interfaces:**
- Produces: 컷아웃 webp 세트(알파, 표시폭 2배 해상도, 총 ≤200KB 목표 — 초과 시 폭 축소). Task 5가 파일명으로 참조.

- [ ] **Step 1: 후보 프레임 그리드 덤프**

스펙 §4 표의 시각(0·6·9·21·24·42·45·48·51·63·66·78s 등)을 1080×1920 원본으로 덤프하고 200px 그리드 오버레이를 얹어 스크래치패드에 저장, 눈으로 각 소품의 crop 박스 좌표를 실측한다.

```bash
S=/private/tmp/claude-501/-Users-jefflee-workspace-naraka-stock/646ec55d-fa12-4cf9-bd3e-08cb5620b260/scratchpad/deco-frames
mkdir -p "$S"
for t in 0.5 6 9 21 24 42 45 48 51 63 66 78.5; do
  ffmpeg -v error -y -ss $t -i ~/Desktop/naraka/reels/07-ae/naraka_reels_fianl.mp4 -frames:v 1 "$S/f$t.png"
done
```

- [ ] **Step 2: 추출 스크립트 작성**

`scripts/extract-video-deco.py` — 경계색 팔레트 BFS(로컬 델타 flood 금지), 먹선은 채색면 7px 이내 유지, 최대 성분 유지(스펙 §4 기법):

```python
#!/usr/bin/env python3
# 릴스 프레임에서 소품 컷아웃 추출 — 경계색 팔레트 BFS + 먹선 근접 유지 + 최대 성분
import os
import subprocess
import sys
from collections import Counter, deque

import numpy as np
from PIL import Image

SRC = os.path.expanduser("~/Desktop/naraka/reels/07-ae/naraka_reels_fianl.mp4")
OUT = os.path.join(os.path.dirname(__file__), "..", "public", "home", "deco", "video")

# (이름, 시각초, (x1,y1,x2,y2), 옵션) — 좌표는 Step 1 그리드 실측으로 채운다
# 옵션: tol=배경 유사 임계(기본 40), multi=True면 1% 이상 성분 모두 유지(거미줄 등), width=출력 폭
PROPS = [
    # 예: ("v-inkwell", 78.5, (520, 1630, 760, 1860), {}),
]

def extract(name, t, box, opt):
    tmp = f"/tmp/deco-{name}.png"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", str(t), "-i", SRC,
                    "-frames:v", "1", tmp], check=True)
    im = Image.open(tmp).convert("RGB").crop(box)
    a = np.asarray(im).astype(np.int16)
    h, w = a.shape[:2]
    tol = opt.get("tol", 40)

    # 1) 경계 2px 색 팔레트 (8단계 양자화 상위 6색)
    border = np.concatenate([a[:2].reshape(-1, 3), a[-2:].reshape(-1, 3),
                             a[:, :2].reshape(-1, 3), a[:, -2:].reshape(-1, 3)])
    pal = [np.array(c) for c, _ in Counter(map(tuple, border // 8 * 8)).most_common(6)]

    def is_bg(px):
        return any(np.abs(px - p).sum() < tol * 3 for p in pal)

    # 2) 경계에서 BFS로 배경 마스크
    bg = np.zeros((h, w), bool)
    q = deque()
    for y in range(h):
        for x in range(w):
            if (y < 2 or y >= h - 2 or x < 2 or x >= w - 2) and is_bg(a[y, x]):
                bg[y, x] = True
                q.append((y, x))
    while q:
        y, x = q.popleft()
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            ny, nx = y + dy, x + dx
            if 0 <= ny < h and 0 <= nx < w and not bg[ny, nx] and is_bg(a[ny, nx]):
                bg[ny, nx] = True
                q.append((ny, nx))
    fg = ~bg

    # 3) 먹선(어두운 픽셀)은 채색면 7px 이내만 유지
    lum = a.mean(axis=2)
    dark = lum < 70
    colored = fg & ~dark
    near = colored.copy()
    for _ in range(7):  # 7px 팽창
        p = np.pad(near, 1)
        near = p[2:, 1:-1] | p[:-2, 1:-1] | p[1:-1, 2:] | p[1:-1, :-2] | near
    fg = colored | (fg & dark & near)

    # 4) 연결 성분 — 기본 최대 1개, multi면 전체의 1% 이상 모두
    lab = np.zeros((h, w), np.int32)
    sizes, cur = {}, 0
    for y in range(h):
        for x in range(w):
            if fg[y, x] and lab[y, x] == 0:
                cur += 1
                lab[y, x] = cur
                q = deque([(y, x)])
                n = 0
                while q:
                    cy, cx = q.popleft()
                    n += 1
                    for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                        ny, nx = cy + dy, cx + dx
                        if 0 <= ny < h and 0 <= nx < w and fg[ny, nx] and lab[ny, nx] == 0:
                            lab[ny, nx] = cur
                            q.append((ny, nx))
                sizes[cur] = n
    if not sizes:
        print(f"[실패] {name}: 전경 없음")
        return
    total = fg.sum()
    if opt.get("multi"):
        keep = {k for k, v in sizes.items() if v >= total * 0.01}
    else:
        keep = {max(sizes, key=lambda k: sizes[k])}
    fg = np.isin(lab, list(keep))

    # 5) 알파 합성 + 트림 + 리사이즈 + 저장
    rgba = np.dstack([np.asarray(im), (fg * 255).astype(np.uint8)])
    ys, xs = np.where(fg)
    out = Image.fromarray(rgba).crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))
    tw = opt.get("width", 280)
    if out.width > tw:
        out = out.resize((tw, round(out.height * tw / out.width)), Image.LANCZOS)
    os.makedirs(OUT, exist_ok=True)
    path = os.path.join(OUT, f"{name}.webp")
    out.save(path, "WEBP", quality=88)
    print(f"[완료] {name}: {out.size}, {os.path.getsize(path)//1024}KB")

if __name__ == "__main__":
    only = sys.argv[1:]
    for name, t, box, opt in PROPS:
        if only and name not in only:
            continue
        extract(name, t, box, opt)
```

- [ ] **Step 3: PROPS 좌표 실측·기입 후 실행**

Step 1 덤프를 보고 스펙 §4 목록에서 12종 이상 좌표를 채우고 실행:

Run: `python3 scripts/extract-video-deco.py`
Expected: 각 소품 `[완료]` 출력. 대상(우선순): v-inkwell(잉크병+깃펜), v-nameplate(명패), v-resume(종신 이력서), v-goldpile(금괴·돈다발), v-ghost(흰 유령), v-mace(철퇴), v-cross(십자가), v-note(음표), v-pumpkin(호박), v-duster(먼지떨이), v-cobweb(거미줄, multi), v-stool(스툴), v-bundle(빨간 보따리), v-jar(유리병), v-books(초록 책더미).

- [ ] **Step 4: QC 콘택트 시트**

전 컷아웃을 체커보드 배경에 나열한 시트를 만들어 눈으로 확인 — 배경 잔재·먹선 소실·성분 손실 발견 시 tol/box 조정 후 해당 소품만 재실행(`python3 scripts/extract-video-deco.py v-이름`).

- [ ] **Step 5: 커밋**

```bash
git add scripts/extract-video-deco.py public/home/deco/video
git commit -m "feat: 릴스 발췌 장식물 컷아웃 라이브러리 — 소품 12종 이상"
```

---

### Task 5: 장식물 배치

**Files:**
- Modify: `src/components/home/HomeDeco.tsx` (신규 소품 로테이션 추가)
- Modify: `src/components/home/HomeFooter.tsx` (명패 에셋)
- Modify: 서브 페이지 4~5곳 포인트 배치 (`about`·`events`·`games`·`notice`·`staff`)

**Interfaces:**
- Consumes: Task 4의 `/home/deco/video/v-*.webp` (실제 생성된 파일명 기준 — 실패로 빠진 소품은 배치도 생략).

- [ ] **Step 1: HomeDeco 확장**

기존 4개(술 장식·위스프2·박쥐)에 신규를 더해 좌우 여백 세로 리듬 유지(페이지당 총 5~6개 이하). 추가 예:

```tsx
<Image
  src="/home/deco/video/v-ghost.webp"
  alt=""
  width={72}
  height={80}
  className="home-wisp-float absolute left-[3vw] top-[560px] [animation-delay:2.2s]"
/>
<Image
  src="/home/deco/video/v-note.webp"
  alt=""
  width={40}
  height={48}
  className="home-wisp-float absolute right-[6vw] top-[620px] [animation-delay:0.4s]"
/>
<Image
  src="/home/deco/video/v-inkwell.webp"
  alt=""
  width={90}
  height={100}
  className="absolute left-[4vw] top-[980px]"
/>
```

- [ ] **Step 2: 푸터 명패**

HomeFooter의 인스타 링크 근처에 `v-nameplate.webp`를 `<Image>`로 배치(링크 장식, alt="", aria-hidden). 기존 돈주머니·고양이 컷아웃과 겹치지 않게.

- [ ] **Step 3: 서브 페이지 포인트**

각 페이지 `home-paper` 시트 바깥 여백/코너에 1~2개씩: about=v-resume, events=v-goldpile, games=v-mace, notice=v-cobweb(코너 고정, 애니 없음), staff=v-duster. 배치는 `pointer-events-none select-none` + `aria-hidden`, xl 이상에서만 표시(`hidden xl:block`) — 기존 HomeDeco 관례 동일.

- [ ] **Step 4: 게이트 + 커밋**

Run: `npm run build && npx eslint src`

```bash
git add src
git commit -m "feat: 영상 발췌 장식물 배치 — 홈 로테이션·푸터 명패·서브페이지 포인트"
```

---

### Task 6: 전 페이지 실앱 검증 + 컨펌 세트

**Files:** 발견 문제 수정만.

- [ ] **Step 1: Playwright 전 페이지 순회**

dev 서버(3000)로 데스크톱(1280×800): `/`(히어로+스크롤 후 본문), `/about`, `/location`, `/menu`, `/staff`, `/notice`, `/events`, `/games` 스크린샷. 모바일(375×812): `/`, `/about`, 달력 영역. 체크: 대비 깨짐(다크 바탕 위 어두운 텍스트·시트 위 밝은 텍스트), 구 골드 잔재, 장식 과밀·본문 침범, 티저→/about 이동.

- [ ] **Step 2: 발견 문제 수정**

수정 → build+lint → `fix:` 커밋.

- [ ] **Step 3: 사장님 컨펌 세트 저장**

스크린샷 전량을 `~/Desktop/naraka/homepage-preview-desk/`에 복사하고 사용자에게 경로 보고. **사장님 컨펌이 머지 조건**임을 최종 보고에 명시. push는 컨펌과 무관하게 PR #80 갱신(머지는 8/31 이후이므로).

- [ ] **Step 4: push**

```bash
git push origin feat/naraka-home
```
