# 릴스 홈페이지 적용 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 릴스 최종본(80초)을 홈페이지에 하이브리드 적용 — 히어로 액자 다이브 스크럽 + 홈 티저 섹션 + `/story` 전용 페이지.

**Architecture:** 에셋은 ffmpeg/PIL 스크립트로 일괄 생성해 `public/`에 정적 배치. 히어로는 기존 `ScrubJourney` frames 모드에 역재생 WebP 시퀀스를 공급(모바일 세트 선택 로직만 보강). 티저·`/story`는 서버 컴포넌트로 신규 작성, 인스타 프레임 목업은 퍼센트 좌표 오버레이.

**Tech Stack:** Next.js 16 App Router, React 19 서버 컴포넌트, TailwindCSS v4(나라카 앤틱 토큰), ffmpeg + Python PIL(에셋 생성).

**스펙:** `docs/superpowers/specs/2026-08-26-reels-homepage-design.md`

## Global Constraints

- 작업 위치: `/Users/jefflee/workspace/naraka-home-wt` (브랜치 feat/naraka-home). naraka-stock 메인 워크트리 건드리지 않는다.
- TypeScript strict, `any` 금지, 들여쓰기 2칸, 더블 쿼트, 세미콜론.
- 코드 주석·커밋 메시지 한국어. 커밋 형식 `type: 한국어 설명`.
- UI 문구에 이모지 금지.
- Server Components 우선 — `"use client"`는 ScrubJourney(기존)만.
- 임포트는 개별 임포트, 경로 alias `@/*`.
- 게이트: `npm run build` + `npx eslint src` 통과(lint는 src 스코프 — 워크트리 관례).
- 원본 소스(읽기 전용): 영상 `~/Desktop/naraka/reels/07-ae/naraka_reels_fianl.mp4`(80s, 1080×1920, 24fps) / 인스타 프레임 `~/Desktop/naraka/reels/06-ae-assets/insta-frame.png`(1080×1920 RGBA, 창 (110,156) 860×1529) / 치비 원화 `~/Desktop/naraka/story/1.png`~`17.png`.
- 인스타 프레임 창 퍼센트 좌표(모든 목업 공통): left 10.19% / top 8.13% / width 79.63% / height 79.64%.

---

### Task 1: 에셋 생성 스크립트 + 실행

**Files:**
- Create: `scripts/build-reels-assets.sh`
- Create(생성물): `public/journey/desktop/s_0001.webp`~`s_0072.webp`, `public/journey/mobile/s_0001.webp`~`s_0072.webp`, `public/journey/stills/{group,frame,desk}.webp`, `public/story/naraka-story.mp4`, `public/story/poster.webp`, `public/story/insta-frame.webp`, `public/story/comic/01.webp`~`17.webp`

**Interfaces:**
- Produces: 위 정적 경로들. 이후 태스크는 이 URL을 그대로 참조한다. 여정 프레임 패턴은 `s_%04d.webp`(1-base), 프레임 수 72(74.0~80.0초 구간 × 12fps, 역순 — 인스타 게시물→책상→액자→단체샷).

- [ ] **Step 1: 스크립트 작성**

`scripts/build-reels-assets.sh`:

```bash
#!/usr/bin/env bash
# 릴스 최종본 → 홈페이지 에셋 일괄 생성 (여정 역재생 프레임·스틸·스토리 영상·원화 webp)
set -euo pipefail

SRC="${REELS_SRC:-$HOME/Desktop/naraka/reels/07-ae/naraka_reels_fianl.mp4}"
FRAME_PNG="${INSTA_FRAME_SRC:-$HOME/Desktop/naraka/reels/06-ae-assets/insta-frame.png}"
COMIC_DIR="${COMIC_SRC:-$HOME/Desktop/naraka/story}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PUB="$ROOT/public"

# 1) 여정 역재생 프레임 — 74.0~80.0초를 역순 12fps로 72장 (데스크톱 1080·모바일 720 세로)
rm -rf "$PUB/journey/desktop" "$PUB/journey/mobile" "$PUB/journey/stills"
mkdir -p "$PUB/journey/desktop" "$PUB/journey/mobile" "$PUB/journey/stills" "$PUB/story/comic"
ffmpeg -v error -ss 74.0 -t 6.0 -i "$SRC" -vf "reverse,fps=12,scale=-2:1080" -c:v libwebp -q:v 78 "$PUB/journey/desktop/s_%04d.webp"
ffmpeg -v error -ss 74.0 -t 6.0 -i "$SRC" -vf "reverse,fps=12,scale=-2:720" -c:v libwebp -q:v 75 "$PUB/journey/mobile/s_%04d.webp"

# 2) 스틸 3종 — 정적 폴백(모션 축소)·재방문 축약 히어로용
ffmpeg -v error -y -ss 74.0 -i "$SRC" -frames:v 1 -vf scale=-2:1080 -c:v libwebp -q:v 82 "$PUB/journey/stills/group.webp"
ffmpeg -v error -y -ss 76.5 -i "$SRC" -frames:v 1 -vf scale=-2:1080 -c:v libwebp -q:v 82 "$PUB/journey/stills/frame.webp"
ffmpeg -v error -y -ss 78.5 -i "$SRC" -frames:v 1 -vf scale=-2:1080 -c:v libwebp -q:v 82 "$PUB/journey/stills/desk.webp"

# 3) 스토리 영상 웹용 재인코딩(+faststart) + 포스터(단체샷)
ffmpeg -v error -y -i "$SRC" -c:v libx264 -crf 23 -preset slow -maxrate 4M -bufsize 8M -pix_fmt yuv420p -c:a aac -b:a 128k -movflags +faststart "$PUB/story/naraka-story.mp4"
ffmpeg -v error -y -ss 74.0 -i "$SRC" -frames:v 1 -vf scale=-2:1080 -c:v libwebp -q:v 82 "$PUB/story/poster.webp"

# 4) 인스타 프레임(알파 유지 540×960)·치비 원화 17장 webp 변환
python3 - "$FRAME_PNG" "$COMIC_DIR" "$PUB" <<'PY'
import sys
from PIL import Image

frame_png, comic_dir, pub = sys.argv[1], sys.argv[2], sys.argv[3]
frame = Image.open(frame_png).convert("RGBA").resize((540, 960), Image.LANCZOS)
frame.save(f"{pub}/story/insta-frame.webp", "WEBP", quality=90)
for i in range(1, 18):
    src = Image.open(f"{comic_dir}/{i}.png").convert("RGB")
    w = 840
    h = round(src.height * w / src.width)
    src.resize((w, h), Image.LANCZOS).save(f"{pub}/story/comic/{i:02d}.webp", "WEBP", quality=85)
PY

echo "desktop $(ls "$PUB/journey/desktop" | wc -l)장 / mobile $(ls "$PUB/journey/mobile" | wc -l)장"
du -sh "$PUB/journey" "$PUB/story"
```

- [ ] **Step 2: 실행**

Run: `cd /Users/jefflee/workspace/naraka-home-wt && chmod +x scripts/build-reels-assets.sh && ./scripts/build-reels-assets.sh`
Expected: `desktop 72장 / mobile 72장` 출력, `public/journey` 총 3~6MB, `public/story` 30MB 안팎(영상 포함).

- [ ] **Step 3: 결과 검증**

Run: `ls public/journey/desktop | head -3 && ls public/story/comic | wc -l && ffprobe -v error -show_entries format=duration,size -of default=noprint_wrappers=1 public/story/naraka-story.mp4 && git check-ignore public/story/naraka-story.mp4 || echo "추적됨"`
Expected: `s_0001.webp` 등 확인, comic 17, duration 80, `추적됨` 출력(gitignore에 안 걸림). 영상 size가 40MB를 크게 넘으면 `-crf 25`로 재실행.
프레임 방향 확인: `public/journey/desktop/s_0001.webp`이 인스타 게시물 화면, `s_0072.webp`이 단체샷이면 정상(역순).

- [ ] **Step 4: 커밋**

```bash
git add scripts/build-reels-assets.sh public/journey public/story
git commit -m "feat: 릴스 최종본 웹 에셋 생성 — 여정 역재생 프레임 72장·스토리 영상·원화 webp"
```

---

### Task 2: 여정 manifest 전환 + ScrubJourney 보강

**Files:**
- Modify: `public/journey/manifest.json` (전체 교체)
- Modify: `src/components/home/journey/ScrubJourney.tsx`

**Interfaces:**
- Consumes: Task 1의 `/journey/desktop|mobile/s_%04d.webp`(72장), `/journey/stills/*.webp`
- Produces: 히어로가 frames 모드로 동작. manifest 스키마는 기존 `JourneyManifest` 그대로(코드 수정은 모바일 세트 선택·레터박스·환영 카피 3가지).

- [ ] **Step 1: manifest.json 교체**

```json
{
  "mode": "frames",
  "scenes": [
    { "id": "group", "label": "나라카 단체 사진", "image": "/journey/stills/group.webp" },
    { "id": "frame", "label": "액자 속으로", "image": "/journey/stills/frame.webp" },
    { "id": "desk", "label": "마녀의 책상", "image": "/journey/stills/desk.webp" }
  ],
  "frames": {
    "basePath": "/journey/desktop",
    "pattern": "s_%04d.webp",
    "count": 72,
    "mobileBasePath": "/journey/mobile",
    "mobileCount": 72
  }
}
```

- [ ] **Step 2: ScrubJourney에 뷰포트별 프레임 세트 선택 추가**

현재 코드는 `mobileBasePath`/`mobileCount`를 사용하지 않는다(manifest에만 존재). 상태 추가:

```tsx
const [framesMeta, setFramesMeta] = useState<{ base: string; count: number } | null>(null);
```

기존 "frames 모드: 프레임 지연 로드" useEffect 전체를 다음으로 교체:

```tsx
// frames 모드: 뷰포트에 맞는 세트 선택 후 프레임 지연 로드
useEffect(() => {
  if (!manifest || manifest.mode !== "frames") return;
  let isMobile = false;
  try {
    isMobile = window.matchMedia("(max-width: 767px)").matches;
  } catch {
    // matchMedia 미지원 환경은 데스크톱 세트 사용
  }
  const base = isMobile ? manifest.frames.mobileBasePath : manifest.frames.basePath;
  const count = isMobile ? manifest.frames.mobileCount : manifest.frames.count;
  if (count === 0) return;
  // eslint-disable-next-line react-hooks/set-state-in-effect -- manifest 도착 시 1회 세트 판정, 외부 API 동기화
  setFramesMeta({ base, count });
  framesRef.current = new Array<HTMLImageElement | null>(count).fill(null);
  for (let i = 0; i < count; i += 1) {
    const img = new Image();
    img.src = frameUrl(base, manifest.frames.pattern, i);
    img.onload = () => {
      framesRef.current[i] = img;
    };
  }
}, [manifest]);
```

canvas 그리기 useEffect의 조건과 인덱스 계산을 `framesMeta` 기반으로 교체(의존성 배열도 `[progress, framesMeta]`):

```tsx
// frames 모드: 진행도에 해당하는 프레임을 canvas에 그린다
useEffect(() => {
  if (!framesMeta) return;
  const canvas = canvasRef.current;
  const ctx = canvas?.getContext("2d");
  if (!canvas || !ctx) return;
  const idx = Math.min(framesMeta.count - 1, Math.floor(progress * framesMeta.count));
  // 가장 가까운 로드 완료 프레임을 찾아 그린다 (미로드 구간 검은 화면 방지)
  for (let i = idx; i >= 0; i -= 1) {
    const img = framesRef.current[i];
    if (img) {
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      ctx.drawImage(img, 0, 0);
      break;
    }
  }
}, [progress, framesMeta]);
```

- [ ] **Step 3: 데스크톱 레터박스 + 종점 환영 카피**

렌더부에서 canvas className을 `"size-full object-cover md:object-contain"`으로 변경(모바일=꽉 채움, 데스크톱=9:16 중앙 배치·양옆은 기존 `bg-[var(--home-stage)]` 무대색).

canvas 바로 다음(건너뛰기 버튼 앞)에 환영 카피 오버레이 추가 — frames 모드 분기와 무관하게 sticky 컨테이너 안:

```tsx
<div
  className="pointer-events-none absolute inset-x-0 bottom-20 px-4 text-center transition-opacity duration-500"
  style={{ opacity: progress > 0.9 ? 1 : 0 }}
>
  <p className="home-serif text-2xl font-extrabold text-[var(--home-gold)] sm:text-3xl">
    나라카에 오신 것을 환영합니다
  </p>
  <p className="home-ui mt-2 text-sm text-[var(--home-surface)]/80">
    지옥이자 감옥이자 직장인 카페
  </p>
</div>
```

- [ ] **Step 4: 게이트 확인**

Run: `cd /Users/jefflee/workspace/naraka-home-wt && npm run build && npx eslint src`
Expected: 둘 다 통과.

- [ ] **Step 5: 커밋**

```bash
git add public/journey/manifest.json src/components/home/journey/ScrubJourney.tsx
git commit -m "feat: 여정 히어로 frames 모드 전환 — 액자 다이브 역재생 스크럽·모바일 세트·환영 카피"
```

---

### Task 3: 홈 스토리 티저 섹션

**Files:**
- Create: `src/components/home/StoryTeaser.tsx`
- Modify: `src/app/(home)/page.tsx` (CalendarSection과 "새 소식" 섹션 사이에 삽입)

**Interfaces:**
- Consumes: `/story/poster.webp`, `/story/insta-frame.webp` (Task 1)
- Produces: `StoryTeaser` 서버 컴포넌트 (props 없음), `/story`로 링크.

- [ ] **Step 1: StoryTeaser.tsx 작성**

```tsx
import Link from "next/link";

// 홈 중단 티저 — 릴스 최종본을 /story에서 보도록 유도하는 인스타 프레임 목업
export function StoryTeaser() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-6">
      <div className="home-paper home-tape p-5 sm:p-7">
        <h2 className="text-xl font-semibold">나라카 채용 설화</h2>
        <p className="mt-2 text-sm text-[var(--home-muted)]">
          마녀 사장이 이력서 세 장을 심사했다. 지원자들은 전부 사고를 치고
          붙잡혔는데 — 그게 바로 채용이었다.
        </p>
        <Link
          href="/story"
          aria-label="채용 설화 영상 보러 가기"
          className="group mx-auto mt-5 block w-full max-w-[260px]"
        >
          <span className="relative block aspect-[9/16] overflow-hidden rounded-xl">
            {/* eslint-disable-next-line @next/next/no-img-element -- 설화 에셋 */}
            <img
              src="/story/poster.webp"
              alt=""
              className="absolute left-[10.19%] top-[8.13%] h-[79.64%] w-[79.63%] object-cover"
            />
            {/* eslint-disable-next-line @next/next/no-img-element -- 설화 에셋 */}
            <img src="/story/insta-frame.webp" alt="" className="absolute inset-0 size-full" />
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="home-btn home-btn-primary px-4 py-2 text-sm transition group-hover:brightness-110">
                영상 보기
              </span>
            </span>
          </span>
        </Link>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: 홈 페이지에 삽입**

`src/app/(home)/page.tsx` 임포트 추가(`import { StoryTeaser } from "@/components/home/StoryTeaser";` — 기존 임포트 알파벳 순서에 맞춰) 후, `<CalendarSection ... />` 닫힘과 "새 소식" `<section>` 사이에 `<StoryTeaser />` 한 줄 삽입.

- [ ] **Step 3: 게이트 확인**

Run: `npm run build && npx eslint src`
Expected: 통과.

- [ ] **Step 4: 커밋**

```bash
git add src/components/home/StoryTeaser.tsx "src/app/(home)/page.tsx"
git commit -m "feat: 홈 채용 설화 티저 섹션 — 인스타 프레임 목업 포스터"
```

---

### Task 4: /story 전용 페이지 + 내비 항목

**Files:**
- Create: `src/app/(home)/story/page.tsx`
- Modify: `src/components/home/HomeHeader.tsx` (HOME_NAV에 항목 추가)

**Interfaces:**
- Consumes: `/story/naraka-story.mp4`, `/story/poster.webp`, `/story/insta-frame.webp`, `/story/comic/01~17.webp` (Task 1), `HOME_INFO.instagramUrl`·`instagramHandle` (`@/lib/homeConfig`), `HomeDeco` (`@/components/home/HomeDeco`)
- Produces: `/story` 라우트. proxy 보호 목록에 없어 공용 접근(수정 불필요).

- [ ] **Step 1: story/page.tsx 작성**

```tsx
import { HomeDeco } from "@/components/home/HomeDeco";
import type { Metadata } from "next";
import { HOME_INFO } from "@/lib/homeConfig";

export const metadata: Metadata = {
  title: "설화",
  description: "나라카 채용 설화 — 마녀 사장의 이력서 심사와 세 요괴의 입사 이야기",
};

// 3막 요약 — 같은 6비트(이력서→욕망→행동→응징→감옥→도장)의 반복
const ACTS = [
  {
    act: "1막",
    name: "멜",
    species: "강시",
    story: "돈 이야기에 눈이 커지는 강시. 금고를 노리다 발차기에 붙잡혀 걸레를 쥐었다. 도장 — 종신.",
  },
  {
    act: "2막",
    name: "바나",
    species: "뱀파이어",
    story: "갈증을 참지 못한 뱀파이어. 남의 창가에 숨어들다 십자가에 쫓겨 먼지떨이를 쥐었다. 도장 — 종신.",
  },
  {
    act: "3막",
    name: "미호",
    species: "구미호",
    story: "본인만 모르는 구미호. 불을 내고 물대포를 맞은 뒤 수세미를 쥐었다. 도장 — 종신.",
  },
] as const;

const COMIC_COUNT = 17;

export default function StoryPage() {
  return (
    <>
      <HomeDeco />
      <main className="mx-auto max-w-3xl px-4 py-10">
        <div className="home-paper p-5 sm:p-8">
          <h1 className="text-2xl font-bold">나라카 채용 설화</h1>
          <p className="mt-4 leading-7">
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

          <h2 className="mt-10 text-xl font-bold">세 번의 채용</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {ACTS.map((a) => (
              <div
                key={a.name}
                className="rounded-lg border border-[var(--home-line)] bg-[var(--home-surface)] p-4"
              >
                <p className="text-xs text-[var(--home-burgundy)]">
                  {a.act} · {a.species}
                </p>
                <p className="mt-1 font-semibold">{a.name}</p>
                <p className="mt-2 text-sm text-[var(--home-muted)]">{a.story}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm leading-6 text-[var(--home-muted)]">
            붙잡히는 것이 곧 채용 — 감옥은 직원 휴게실이고, 벽의 형기 빗금은
            근속이 됩니다. 오늘도 요괴들이 손님을 맞이합니다.
          </p>

          <h2 className="mt-10 text-xl font-bold">원화 컷</h2>
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

주의: lint가 `<video>`에 `jsx-a11y/media-has-caption`을 요구하면(무성 스토리 — 대사 없음, 효과음뿐) `<track kind="captions" src="data:," label="없음" />` 대신 규칙 예외 주석 `{/* eslint-disable-next-line jsx-a11y/media-has-caption -- 무성 애니메이션(대사 없음) */}`을 단다. 기본 Next lint 구성엔 이 규칙이 없어 대개 불필요.

- [ ] **Step 2: HOME_NAV에 항목 추가**

`src/components/home/HomeHeader.tsx`의 `HOME_NAV` 배열에서 `{ href: "/about", label: "소개" }` 바로 다음에 추가:

```tsx
  { href: "/story", label: "설화" },
```

- [ ] **Step 3: 게이트 확인**

Run: `npm run build && npx eslint src`
Expected: 통과. `/story`가 빌드 라우트 목록에 표시.

- [ ] **Step 4: 커밋**

```bash
git add "src/app/(home)/story/page.tsx" src/components/home/HomeHeader.tsx
git commit -m "feat: 채용 설화 페이지 — 풀 영상 플레이어·3막 소개·원화 캐러셀·내비 추가"
```

---

### Task 5: 실앱 검증 (Playwright)

**Files:** 수정 없음(발견된 문제만 수정 후 개별 커밋).

**Interfaces:**
- Consumes: Task 1~4 결과 전체. dev 서버 `PORT=3100 npm run dev` (naraka-home-wt에서), 로컬 Supabase 필요(`npx supabase start` — 홈은 force-dynamic으로 DB 조회).

- [ ] **Step 1: dev 서버 기동**

Run(백그라운드·워치독): `cd /Users/jefflee/workspace/naraka-home-wt && PORT=3100 npm run dev` — 검증 종료 후 반드시 프로세스 종료(`pkill -f "next dev.*3100"` sweep).
Expected: `http://localhost:3100` 응답.

- [ ] **Step 2: 히어로 스크럽 검증**

Playwright MCP로 `http://localhost:3100` 접속(신규 컨텍스트 = localStorage 빈 상태 → 풀 여정).
- 첫 화면: canvas에 인스타 게시물 프레임(s_0001) 렌더 확인 (스크린샷)
- `browser_evaluate`로 `window.scrollTo(0, document.body.scrollHeight * 0.25)` 등 3단계 스크롤 → 프레임이 책상→액자→단체샷으로 진행되는지 스크린샷
- 스크럽 종점(progress>0.9)에서 "나라카에 오신 것을 환영합니다" 카피 표시 확인
- 뷰포트 375×812로 리사이즈 후 새 접속 → 모바일 세트 로드(네트워크 요청에 `/journey/mobile/`) 확인

- [ ] **Step 3: 티저·/story 검증**

- 홈 스크롤: 달력 아래 "나라카 채용 설화" 티저(인스타 프레임+포스터+영상 보기 버튼) 스크린샷
- 티저 클릭 → `/story` 이동 확인
- `/story`: 플레이어 포스터 표시, 재생 버튼 클릭 후 2초 뒤 currentTime > 0 확인(`browser_evaluate`), 3막 카드·원화 캐러셀 스크롤·인스타 링크 href 확인, 스크린샷
- 헤더 내비에 "설화" 항목 표시·클릭 이동 확인

- [ ] **Step 4: 발견 문제 수정 + 마무리**

문제 있으면 수정 → `npm run build && npx eslint src` 재확인 → `fix:` 커밋. dev 서버·잔존 프로세스 정리. 최종 `git log --oneline -6`으로 커밋 5~6개 확인.
