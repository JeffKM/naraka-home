# 나라카 공식 홈페이지 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 카페 공식 홈페이지를 루트(`/`)에 세우고, 기존 나라카증권 주식앱을 `/event/*`로 편입한다 (스펙: `docs/superpowers/specs/2026-08-24-naraka-home-design.md`).

**Architecture:** 같은 Next.js 16 App Router 앱 안에서 주식앱 페이지 라우트를 `src/app/event/`로 이동(API `/api/*`는 불변)하고, 루트에 `(home)` Route Group으로 카페 홈을 신설한다. 홈 콘텐츠(공지·이벤트/메뉴/스태프/출근표)는 Supabase 신규 테이블 + 기존 어드민 콘솔 확장으로 관리하고, 공개 페이지는 Server Component가 서비스 레이어를 직접 호출한다. 랜딩은 프레임 시퀀스 canvas 스크럽 엔진(자체 구현)으로, 실제 에셋 도착 전까지 플레이스홀더 정지 장면으로 동작한다.

**Tech Stack:** Next.js 16(App Router, Turbopack) / React 19 / TypeScript 5 strict / TailwindCSS v4 + shadcn/ui / Supabase(Postgres+Storage) / Zod v4 / vitest(신규, 순수 유틸 테스트용) / react-markdown(신규, 공지 본문 렌더)

## Global Constraints

- **작업 위치**: 워크트리 `/Users/jefflee/workspace/naraka-home-wt`, 브랜치 `feat/naraka-home` (main 기준). **main·프로덕션은 8/30까지 무변경, 이 브랜치는 8/31 이후에만 머지.**
- **Next.js 16 주의**: 이 레포의 Next는 학습 데이터와 다를 수 있음 — 코드 작성 전 `node_modules/next/dist/docs/`에서 해당 API 문서 확인 (AGENTS.md). 특히 `params`/`searchParams`는 **Promise**라 `await` 필요. 구 middleware는 `src/proxy.ts`.
- TypeScript strict, `any` 금지 / 들여쓰기 2칸 / 세미콜론 / 더블 쿼트 / 개별 임포트(lucide-react 포함) / 경로 alias `@/*`
- 변수·함수 camelCase, 컴포넌트 PascalCase / 코드 주석·커밋 메시지 한국어 / 커밋 형식 `type: 한국어 설명`
- API 응답은 `ApiResponse<T>` 래퍼 (`apiOk`/`apiError`/`handleApiError`, `@/lib/api/response`), 어드민 API는 `requireAdmin()` 가드
- **UI 문구에 이모지 금지** (사장님 확정 선호)
- **금지 어휘 (파생어 포함, 모든 문안)**: 저승, 이승, 천계, 명계, 명부, 도깨비, 옥황상제, 염라대왕, 원혼, 혼령, 혼백, 영혼, 삼도천, 환생, 상여, 성불, 극락. ("지옥" 자체는 허용 — 컨셉 "아기자기한 지옥")
- 등장인물 캐논: 마녀 옥자, 구미호 미호, 강시 멜, 뱀파이어 바나, 주방요괴, 방문자들 (+펫 시온·코코·규종·선아·수아). 새 인물 창조 금지.
- 마이그레이션 타임스탬프: origin/main 최신이 `20260720050000` — 신규는 `20260824000000` 사용 (버전 충돌 함정 주의)
- lint는 워크트리에서 `npx eslint src`로 스코프 실행 / dev 서버 등 장기 프로세스는 워치독 패턴 `( cmd & pid=$!; ( sleep N; kill -9 $pid 2>/dev/null ) & wd=$!; wait $pid; kill $wd 2>/dev/null )` + 종료 후 `pkill -f "next dev"` 청소
- Server Components 우선 — 클라이언트 상호작용이 필요한 컴포넌트만 `"use client"`

---

### Task 1: 워크트리 준비·베이스라인 확인

**Files:** 없음 (환경 준비)

**Interfaces:**
- Produces: 빌드·린트가 통과하는 베이스라인 워크트리 (이후 모든 태스크의 전제)

- [ ] **Step 1: 의존성 설치**

```bash
cd /Users/jefflee/workspace/naraka-home-wt && npm install
```
Expected: 에러 없이 완료 (`node_modules` 생성)

- [ ] **Step 2: 베이스라인 빌드·린트**

```bash
cd /Users/jefflee/workspace/naraka-home-wt && npm run build && npx eslint src
```
Expected: 둘 다 exit 0. 실패 시 여기서 멈추고 원인 보고 (베이스라인이 깨져 있으면 이후 작업 불가)

- [ ] **Step 3: 로컬 Supabase 기동 확인**

```bash
cd /Users/jefflee/workspace/naraka-home-wt && npx supabase start 2>&1 | tail -3 && npx supabase db reset 2>&1 | tail -3
```
Expected: reset 성공 (마이그레이션 + seed 적용). Docker 미기동이면 Docker 시작 후 재시도

---

### Task 2: 주식앱 → `/event` 이동 + 레이아웃 분리 + 리다이렉트

루트를 비워 카페 홈 자리를 만든다. **API 라우트(`src/app/api/*`)는 절대 이동하지 않는다** (pg_cron 배치가 `/api/cron/daily-batch`를 호출).

**Files:**
- Move: `src/app/page.tsx` → `src/app/event/page.tsx`, `src/app/loading.tsx` → `src/app/event/loading.tsx`, `src/app/{guide,history,news,portfolio,stocks,support}` → `src/app/event/…`, `src/app/(auth)/login` → `src/app/event/login`, `src/app/(auth)/signup` → `src/app/event/signup` (빈 `(auth)` 삭제)
- Create: `src/app/event/layout.tsx`
- Modify: `src/app/layout.tsx`, `src/app/admin/layout.tsx`, `src/proxy.ts`, `next.config.ts`, `src/components/layout/BottomNav.tsx`, `src/components/layout/Header.tsx`, 그 외 grep으로 찾은 내부 링크 파일들

**Interfaces:**
- Produces: 루트 `/`가 비어 있음(404 상태 — Task 8에서 채움). 주식앱 전체가 `/event/*`에서 동작. 구 URL은 307 리다이렉트.

- [ ] **Step 1: 페이지 라우트 이동**

```bash
cd /Users/jefflee/workspace/naraka-home-wt
mkdir -p src/app/event
git mv src/app/page.tsx src/app/event/page.tsx
git mv src/app/loading.tsx src/app/event/loading.tsx
for d in guide history news portfolio stocks support; do git mv "src/app/$d" "src/app/event/$d"; done
git mv "src/app/(auth)/login" src/app/event/login
git mv "src/app/(auth)/signup" src/app/event/signup
rmdir "src/app/(auth)"
```

- [ ] **Step 2: 루트 레이아웃을 공통 셸로 축소**

`src/app/layout.tsx` 전체를 다음으로 교체 (폰트·전역 CSS·Providers·Toaster만 공통 유지, 주식앱 크롬은 event 레이아웃으로 이동):

```tsx
import type { Metadata, Viewport } from "next";
import { Geist_Mono, Noto_Sans_KR } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { Toaster } from "@/components/ui/sonner";

const notoSansKr = Noto_Sans_KR({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const OG_DESCRIPTION = "대구 동성로 요괴 컨셉카페 나라카 — 요괴들의 도시에 오신 것을 환영합니다";

export const metadata: Metadata = {
  metadataBase: new URL("https://naraka.cafe"),
  title: {
    default: "나라카",
    template: "나라카 | %s",
  },
  description: OG_DESCRIPTION,
  openGraph: {
    type: "website",
    siteName: "나라카",
    title: "나라카",
    description: OG_DESCRIPTION,
    url: "/",
    locale: "ko_KR",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "나라카" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "나라카",
    description: OG_DESCRIPTION,
    images: ["/og.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#1d1726",
};

// 공통 셸 — 폰트·전역 프로바이더·토스터만. 페이지 크롬은 각 구역 레이아웃이 담당한다.
// (event = 나라카증권 크롬, (home) = 카페 홈 크롬, admin = 콘솔)
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      suppressHydrationWarning
      className={`${notoSansKr.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-dvh flex-col">
        <Providers>
          {children}
          <Toaster position="top-center" />
        </Providers>
      </body>
    </html>
  );
}
```

- [ ] **Step 3: 주식앱 크롬을 event 레이아웃으로**

`src/app/event/layout.tsx` 생성 (기존 루트 레이아웃의 크롬 그대로 + 나라카증권 메타데이터):

```tsx
import type { Metadata } from "next";
import { BottomNav } from "@/components/layout/BottomNav";
import { FetchIndicator } from "@/components/layout/FetchIndicator";
import { Header } from "@/components/layout/Header";
import { HoldingAlertWatcher } from "@/components/layout/HoldingAlertWatcher";
import { MarketGridBackdrop } from "@/components/layout/MarketGridBackdrop";
import { MarketHaltBanner } from "@/components/quotes/MarketHaltBanner";

const OG_DESCRIPTION =
  "요괴 컨셉카페 나라카의 8월 이벤트 — 가상 화폐로 즐기는 모의 주식 거래";

export const metadata: Metadata = {
  title: {
    default: "나라카증권",
    template: "나라카증권 | %s",
  },
  description: OG_DESCRIPTION,
  openGraph: {
    type: "website",
    siteName: "나라카증권",
    title: "나라카증권",
    description: OG_DESCRIPTION,
    url: "/event",
    locale: "ko_KR",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "나라카증권" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "나라카증권",
    description: OG_DESCRIPTION,
    images: ["/og.png"],
  },
};

// 나라카증권(주식 이벤트) 구역 크롬 — 기존 루트 레이아웃에서 그대로 이동
export default function EventLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <MarketGridBackdrop />
      <FetchIndicator />
      <HoldingAlertWatcher />
      <Header />
      <MarketHaltBanner />
      <main className="mx-auto w-full max-w-lg flex-1 px-4 pb-24 pt-4">
        {children}
      </main>
      <BottomNav />
    </>
  );
}
```

- [ ] **Step 4: 어드민 레이아웃에 main 래퍼 추가**

어드민은 지금까지 루트 레이아웃의 `<main>` 래퍼에 의존했다. `src/app/admin/layout.tsx`의 `return children;`을 다음으로 교체:

```tsx
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto w-full max-w-lg flex-1 px-4 pb-24 pt-4">
      {children}
    </main>
  );
}
```

- [ ] **Step 5: proxy.ts 경로 갱신**

`src/proxy.ts`의 상수·리다이렉트 목적지를 `/event` 기준으로 교체:

```ts
const PROTECTED_PREFIXES = [
  "/event/portfolio",
  "/event/history",
  "/event/support",
  "/admin",
];
const AUTH_PAGES = ["/event/login", "/event/signup"];
// 어드민 리다이렉트 예외 — 게임 방법 등 어드민도 볼 수 있는 공용 안내 페이지
const ADMIN_ALLOWED_PAGES = ["/event/guide"];
```

어드민 리다이렉트 조건은 "이벤트 구역 안에서만" 적용 (카페 홈·서브페이지는 어드민도 자유롭게 열람):

```ts
  // 어드민 → 이벤트 방문자 페이지 대신 운영자 콘솔로 (카페 홈은 공용이라 예외)
  if (
    session?.isAdmin &&
    pathname.startsWith("/event") &&
    !ADMIN_ALLOWED_PAGES.includes(pathname)
  ) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }
```

비로그인 보호 라우트 리다이렉트 목적지 `"/login"` → `"/event/login"`, 로그인 상태 AUTH_PAGES 리다이렉트 목적지 `"/"` → `"/event"`로 교체.

- [ ] **Step 6: next.config.ts에 구 URL 리다이렉트 추가**

`nextConfig` 객체에 `headers()` 아래로 추가:

```ts
  // 주식앱 /event 편입에 따른 구 URL 리다이렉트 (참가자 북마크·홈화면 바로가기 보존)
  async redirects() {
    return [
      { source: "/stocks/:path*", destination: "/event/stocks/:path*", permanent: false },
      { source: "/news/:path*", destination: "/event/news/:path*", permanent: false },
      { source: "/portfolio", destination: "/event/portfolio", permanent: false },
      { source: "/history", destination: "/event/history", permanent: false },
      { source: "/guide", destination: "/event/guide", permanent: false },
      { source: "/support", destination: "/event/support", permanent: false },
      { source: "/login", destination: "/event/login", permanent: false },
      { source: "/signup", destination: "/event/signup", permanent: false },
    ];
  },
```

- [ ] **Step 7: 내부 링크 전수 수정**

아래 grep으로 구 경로 사용처를 전부 찾아 `/event` 접두사를 붙인다 (proxy.ts·next.config.ts의 의도적 사용은 제외):

```bash
cd /Users/jefflee/workspace/naraka-home-wt
grep -rnE '"/(stocks|portfolio|news|history|guide|support|login|signup)' src --include="*.tsx" --include="*.ts" | grep -v "proxy.ts" | grep -v "next.config"
grep -rn '`/stocks/' src
grep -rnE '(href=|push\(|replace\(|redirect\(|location\.(href|assign)\s*=?\s*)"/"' src
```

알려진 수정 지점 (grep 결과로 누락 검증):
- `src/components/layout/BottomNav.tsx` — 탭 4개 href: `"/"`→`"/event"`, `"/news"`→`"/event/news"`, `"/portfolio"`→`"/event/portfolio"`, `"/support"`→`"/event/support"` (+ 활성 판정이 `pathname === "/"` 비교라면 `"/event"`로)
- `src/components/layout/Header.tsx` — 로고 링크 `href="/"` → `href="/event"`
- `src/app/event/history/page.tsx` — `redirect("/portfolio")` → `redirect("/event/portfolio")`
- `src/app/event/login/page.tsx`·`signup/page.tsx` — 로그인 성공 하드 내비게이션 `"/"` → `"/event"`, 가입↔로그인 상호 링크 `"/signup"`·`"/login"` → `/event/...`
- 시세·뉴스 컴포넌트의 `` `/stocks/${code}` ``·`"/news/..."` 템플릿 링크 전부
- 주의: `"/api/..."` fetch 경로는 수정 대상 아님. `login?next=` 파라미터 흐름은 proxy가 pathname을 넣으므로 자동으로 `/event/*`가 됨.

수정 후 재실행해 잔여 0건 확인:

```bash
grep -rnE '"/(stocks|portfolio|news|history|guide|support|login|signup)' src --include="*.tsx" --include="*.ts" | grep -v "proxy.ts" | grep -v "next.config" | grep -v '"/event'
```
Expected: 출력 없음

- [ ] **Step 8: 빌드·수동 스모크**

```bash
cd /Users/jefflee/workspace/naraka-home-wt && npm run build && npx eslint src
```
Expected: 통과. 이어서 dev 서버 스모크 (워치독 패턴, 30초 내 curl 후 종료):

```bash
cd /Users/jefflee/workspace/naraka-home-wt
( npm run dev & pid=$!; ( sleep 45; kill -9 $pid 2>/dev/null ) & wd=$!; \
  sleep 12; \
  echo "event: $(curl -s -o /dev/null -w '%{http_code}' localhost:3000/event)"; \
  echo "old-redirect: $(curl -s -o /dev/null -w '%{http_code} %{redirect_url}' localhost:3000/portfolio)"; \
  echo "root: $(curl -s -o /dev/null -w '%{http_code}' localhost:3000/)"; \
  kill $pid 2>/dev/null; kill $wd 2>/dev/null ); pkill -f "next dev" 2>/dev/null; true
```
Expected: `event: 200`, `old-redirect: 307 …/event/portfolio`, `root: 404` (홈은 Task 8에서 생성)

- [ ] **Step 9: 커밋**

```bash
cd /Users/jefflee/workspace/naraka-home-wt && git add -A && git commit -m "refactor: 주식앱 페이지를 /event 하위로 편입 (API 불변·구 URL 리다이렉트·레이아웃 분리)"
```

---

### Task 3: 홈 콘텐츠 DB 마이그레이션 + Storage 활성화

**Files:**
- Create: `supabase/migrations/20260824000000_home_content.sql`
- Modify: `supabase/config.toml` (storage enabled)

**Interfaces:**
- Produces: 테이블 `home_posts`, `home_staff`, `home_schedule`, `home_menu_items` + 공개 버킷 `home-assets`. 컬럼명은 아래 SQL이 정본 — 이후 태스크의 서비스 레이어가 이 스키마에 의존.

- [ ] **Step 1: config.toml storage 활성화**

`supabase/config.toml`의 `[storage]` 섹션에서 `enabled = false` → `enabled = true`

- [ ] **Step 2: 마이그레이션 작성**

`supabase/migrations/20260824000000_home_content.sql`:

```sql
-- 카페 홈페이지 콘텐츠 (naraka-home): 공지·이벤트 / 스태프 / 출근표 / 메뉴
-- 쓰기는 전부 서버(서비스 롤, 어드민 API)에서만 — RLS는 공개 읽기 범위만 연다.

create table home_posts (
  id bigint generated always as identity primary key,
  type text not null check (type in ('notice', 'event')),
  title text not null,
  body_md text not null default '',
  cover_image_url text,
  pinned boolean not null default false,
  published boolean not null default true,
  published_at timestamptz not null default now(),
  event_start_date date,
  event_end_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- 이벤트 글은 달력 표시를 위해 시작일 필수, 공지는 날짜 없음
  constraint home_posts_event_dates check (type = 'notice' or event_start_date is not null),
  constraint home_posts_date_order check (
    event_end_date is null or event_start_date is null or event_end_date >= event_start_date
  )
);
create index idx_home_posts_list on home_posts (type, pinned desc, published_at desc);
create index idx_home_posts_event_range on home_posts (event_start_date, event_end_date)
  where type = 'event';

create table home_staff (
  id bigint generated always as identity primary key,
  name text not null,
  role text not null default '',
  photo_url text,
  intro text not null default '',
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- 출근표 — 하루 안에서도 시간대가 나뉘므로 (날짜, 스태프, 시간대) 단위 행
create table home_schedule (
  id bigint generated always as identity primary key,
  work_date date not null,
  staff_id bigint not null references home_staff (id) on delete cascade,
  start_min int not null check (start_min >= 0 and start_min < 1440),
  end_min int not null check (end_min > 0 and end_min <= 1440),
  created_at timestamptz not null default now(),
  constraint home_schedule_time_order check (end_min > start_min)
);
create index idx_home_schedule_date on home_schedule (work_date);

create table home_menu_items (
  id bigint generated always as identity primary key,
  category text not null,
  name text not null,
  price int not null check (price >= 0),
  description text not null default '',
  image_url text,
  sort_order int not null default 0,
  is_sold_out boolean not null default false,
  created_at timestamptz not null default now()
);
create index idx_home_menu_list on home_menu_items (category, sort_order);

alter table home_posts enable row level security;
alter table home_staff enable row level security;
alter table home_schedule enable row level security;
alter table home_menu_items enable row level security;

-- 공개 읽기 (서비스 롤은 RLS 우회하므로 쓰기 정책 불필요)
create policy home_posts_public_read on home_posts for select using (published = true);
create policy home_staff_public_read on home_staff for select using (is_active = true);
create policy home_schedule_public_read on home_schedule for select using (true);
create policy home_menu_public_read on home_menu_items for select using (true);

-- 홈 이미지 업로드용 공개 버킷 (공개 URL 읽기, 업로드는 어드민 API의 서비스 롤만)
insert into storage.buckets (id, name, public)
values ('home-assets', 'home-assets', true)
on conflict (id) do nothing;
```

- [ ] **Step 3: 적용·검증**

```bash
cd /Users/jefflee/workspace/naraka-home-wt && npx supabase db reset 2>&1 | tail -3
PGURL=$(npx supabase status --output json 2>/dev/null | python3 -c "import json,sys;print(json.load(sys.stdin)['DB_URL'])" 2>/dev/null || echo "postgresql://postgres:postgres@127.0.0.1:54322/postgres")
psql "$PGURL" -c "\d home_schedule" -c "select id, public from storage.buckets where id='home-assets';"
```
Expected: reset 성공, `home_schedule` 테이블 정의 출력, 버킷 1행 (`public = t`)

- [ ] **Step 4: 커밋**

```bash
cd /Users/jefflee/workspace/naraka-home-wt && git add supabase && git commit -m "feat: 홈 콘텐츠 테이블 4종·RLS·home-assets 버킷 마이그레이션 (storage 활성화)"
```

---

### Task 4: vitest 셋업 + 달력 순수 유틸 (TDD)

**Files:**
- Create: `vitest.config.ts`, `src/lib/homeCalendar.ts`, `src/lib/homeCalendar.test.ts`
- Modify: `package.json` (devDependency `vitest`, script `"test": "vitest run"`)

**Interfaces:**
- Produces (이후 태스크가 사용하는 정확한 시그니처):

```ts
export interface CalendarEventItem {
  id: number;
  title: string;
  startDate: string;      // YYYY-MM-DD
  endDate: string | null; // 단일일 이벤트는 null
}
export interface CalendarScheduleItem {
  workDate: string; // YYYY-MM-DD
  staffId: number;
  startMin: number; // 0~1439
  endMin: number;   // 1~1440
}
export interface CalendarDayCell {
  date: string;       // YYYY-MM-DD
  inMonth: boolean;   // 해당 월 소속 여부 (앞뒤 채움일은 false)
  isToday: boolean;
  events: CalendarEventItem[];
  staffIds: number[]; // 그날 출근 스태프 (중복 제거, 오름차순)
}
// month: "YYYY-MM". 월요일 시작 주 단위 그리드 (행=주, 열=7)
export function buildMonthGrid(
  month: string,
  todayKst: string,
  events: CalendarEventItem[],
  schedule: CalendarScheduleItem[]
): CalendarDayCell[][];
export function formatMinute(min: number): string; // 750 → "12:30", 1440 → "24:00"
export function shiftMonth(month: string, delta: number): string; // ("2026-08", -1) → "2026-07"
```

- [ ] **Step 1: vitest 설치·설정**

```bash
cd /Users/jefflee/workspace/naraka-home-wt && npm install -D vitest
```

`vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
  test: {
    include: ["src/**/*.test.ts"],
  },
});
```

`package.json` scripts에 추가: `"test": "vitest run"`

- [ ] **Step 2: 실패하는 테스트 작성**

`src/lib/homeCalendar.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  buildMonthGrid,
  formatMinute,
  shiftMonth,
  type CalendarEventItem,
  type CalendarScheduleItem,
} from "./homeCalendar";

// 2026-08-01은 토요일 — 월요일 시작 그리드면 앞 채움 5일(7/27~31), 총 6주
describe("buildMonthGrid", () => {
  it("2026-08은 월요일 시작 6주 그리드", () => {
    const grid = buildMonthGrid("2026-08", "2026-08-24", [], []);
    expect(grid).toHaveLength(6);
    for (const week of grid) expect(week).toHaveLength(7);
    expect(grid[0][0].date).toBe("2026-07-27");
    expect(grid[0][0].inMonth).toBe(false);
    expect(grid[0][5].date).toBe("2026-08-01");
    expect(grid[0][5].inMonth).toBe(true);
    expect(grid[5][6].date).toBe("2026-09-06");
  });

  it("오늘 표시는 todayKst와 일치하는 칸에만", () => {
    const grid = buildMonthGrid("2026-08", "2026-08-24", [], []);
    const cells = grid.flat();
    const today = cells.filter((c) => c.isToday);
    expect(today).toHaveLength(1);
    expect(today[0].date).toBe("2026-08-24");
  });

  it("기간 이벤트는 범위 안 모든 날짜에 전개된다", () => {
    const events: CalendarEventItem[] = [
      { id: 1, title: "나라카증권", startDate: "2026-08-01", endDate: "2026-08-03" },
      { id: 2, title: "하루 이벤트", startDate: "2026-08-02", endDate: null },
    ];
    const grid = buildMonthGrid("2026-08", "2026-08-24", events, []);
    const byDate = new Map(grid.flat().map((c) => [c.date, c]));
    expect(byDate.get("2026-08-01")?.events.map((e) => e.id)).toEqual([1]);
    expect(byDate.get("2026-08-02")?.events.map((e) => e.id)).toEqual([1, 2]);
    expect(byDate.get("2026-08-03")?.events.map((e) => e.id)).toEqual([1]);
    expect(byDate.get("2026-08-04")?.events).toEqual([]);
  });

  it("출근 스태프는 날짜별 중복 제거·오름차순", () => {
    const schedule: CalendarScheduleItem[] = [
      { workDate: "2026-08-02", staffId: 3, startMin: 720, endMin: 1080 },
      { workDate: "2026-08-02", staffId: 1, startMin: 1080, endMin: 1440 },
      { workDate: "2026-08-02", staffId: 3, startMin: 1080, endMin: 1440 },
    ];
    const grid = buildMonthGrid("2026-08", "2026-08-24", [], schedule);
    const day = grid.flat().find((c) => c.date === "2026-08-02");
    expect(day?.staffIds).toEqual([1, 3]);
  });
});

describe("formatMinute", () => {
  it("분 → HH:MM", () => {
    expect(formatMinute(0)).toBe("00:00");
    expect(formatMinute(750)).toBe("12:30");
    expect(formatMinute(1440)).toBe("24:00");
  });
});

describe("shiftMonth", () => {
  it("연 경계 이동", () => {
    expect(shiftMonth("2026-08", 1)).toBe("2026-09");
    expect(shiftMonth("2026-01", -1)).toBe("2025-12");
    expect(shiftMonth("2026-12", 1)).toBe("2027-01");
  });
});
```

- [ ] **Step 3: 실패 확인**

```bash
cd /Users/jefflee/workspace/naraka-home-wt && npx vitest run src/lib/homeCalendar.test.ts
```
Expected: FAIL — `Cannot find module './homeCalendar'` 계열 오류

- [ ] **Step 4: 구현**

`src/lib/homeCalendar.ts`:

```ts
// 카페 홈 달력·출근표 순수 유틸 (타임존 이슈 방지를 위해 전부 UTC 산술)

export interface CalendarEventItem {
  id: number;
  title: string;
  startDate: string;
  endDate: string | null;
}

export interface CalendarScheduleItem {
  workDate: string;
  staffId: number;
  startMin: number;
  endMin: number;
}

export interface CalendarDayCell {
  date: string;
  inMonth: boolean;
  isToday: boolean;
  events: CalendarEventItem[];
  staffIds: number[];
}

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function parseUtc(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

// month("YYYY-MM") → 월요일 시작 주 단위 그리드
export function buildMonthGrid(
  month: string,
  todayKst: string,
  events: CalendarEventItem[],
  schedule: CalendarScheduleItem[]
): CalendarDayCell[][] {
  const [year, mon] = month.split("-").map(Number);
  const first = new Date(Date.UTC(year, mon - 1, 1));
  const daysInMonth = new Date(Date.UTC(year, mon, 0)).getUTCDate();
  const lead = (first.getUTCDay() + 6) % 7; // 월요일=0 기준 앞 채움 일수
  const totalCells = Math.ceil((lead + daysInMonth) / 7) * 7;

  // 날짜별 이벤트 전개 (기간 이벤트는 각 날짜에 복제)
  const eventsByDate = new Map<string, CalendarEventItem[]>();
  for (const ev of events) {
    const end = parseUtc(ev.endDate ?? ev.startDate);
    for (let d = parseUtc(ev.startDate); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
      const key = toDateStr(d);
      const list = eventsByDate.get(key) ?? [];
      list.push(ev);
      eventsByDate.set(key, list);
    }
  }

  const staffByDate = new Map<string, Set<number>>();
  for (const s of schedule) {
    const set = staffByDate.get(s.workDate) ?? new Set<number>();
    set.add(s.staffId);
    staffByDate.set(s.workDate, set);
  }

  const weeks: CalendarDayCell[][] = [];
  const cursor = new Date(Date.UTC(year, mon - 1, 1 - lead));
  for (let i = 0; i < totalCells; i += 1) {
    const date = toDateStr(cursor);
    const cell: CalendarDayCell = {
      date,
      inMonth: cursor.getUTCMonth() === mon - 1,
      isToday: date === todayKst,
      events: eventsByDate.get(date) ?? [],
      staffIds: [...(staffByDate.get(date) ?? [])].sort((a, b) => a - b),
    };
    if (i % 7 === 0) weeks.push([]);
    weeks[weeks.length - 1].push(cell);
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return weeks;
}

export function formatMinute(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}
```

- [ ] **Step 5: 통과 확인 + 커밋**

```bash
cd /Users/jefflee/workspace/naraka-home-wt && npx vitest run && npx eslint src/lib/homeCalendar.ts src/lib/homeCalendar.test.ts
git add package.json package-lock.json vitest.config.ts src/lib/homeCalendar.ts src/lib/homeCalendar.test.ts
git commit -m "feat: 홈 달력 순수 유틸(월 그리드·기간 전개·출근 병합) + vitest 도입"
```
Expected: 테스트 3그룹 전부 PASS

---

### Task 5: 홈 콘텐츠 타입·서비스 레이어

**Files:**
- Create: `src/types/home.ts`, `src/services/homeContentService.ts`

**Interfaces:**
- Consumes: Task 3 스키마, `getSupabaseAdmin()` (`@/lib/supabase/server`)
- Produces (어드민 API·공개 페이지가 사용):

```ts
// src/types/home.ts
export type HomePostType = "notice" | "event";
export interface HomePost {
  id: number; type: HomePostType; title: string; bodyMd: string;
  coverImageUrl: string | null; pinned: boolean; published: boolean;
  publishedAt: string; eventStartDate: string | null; eventEndDate: string | null;
}
export interface HomeStaff {
  id: number; name: string; role: string; photoUrl: string | null;
  intro: string; sortOrder: number; isActive: boolean;
}
export interface HomeScheduleEntry {
  id: number; workDate: string; staffId: number; startMin: number; endMin: number;
}
export interface HomeMenuItem {
  id: number; category: string; name: string; price: number;
  description: string; imageUrl: string | null; sortOrder: number; isSoldOut: boolean;
}
```

```ts
// src/services/homeContentService.ts — 전부 async, 서비스 롤 사용
listPosts(opts?: { type?: HomePostType; includeUnpublished?: boolean; limit?: number }): Promise<HomePost[]>
getPost(id: number, includeUnpublished?: boolean): Promise<HomePost | null>
createPost(input: { type: HomePostType; title: string; bodyMd: string; coverImageUrl?: string | null; pinned?: boolean; published?: boolean; eventStartDate?: string | null; eventEndDate?: string | null }): Promise<number> // 새 id
updatePost(id: number, patch: Partial<Omit<HomePost, "id" | "publishedAt">>): Promise<void>
deletePost(id: number): Promise<void>
listStaff(activeOnly: boolean): Promise<HomeStaff[]>
createStaff(input: { name: string; role?: string; photoUrl?: string | null; intro?: string; sortOrder?: number }): Promise<number>
updateStaff(id: number, patch: Partial<Omit<HomeStaff, "id">>): Promise<void>
deleteStaff(id: number): Promise<void>
listScheduleRange(startDate: string, endDate: string): Promise<HomeScheduleEntry[]>
replaceDaySchedule(workDate: string, entries: { staffId: number; startMin: number; endMin: number }[]): Promise<void> // 그날 전체 교체(삭제 후 삽입)
listMenu(): Promise<HomeMenuItem[]>
createMenuItem(input: { category: string; name: string; price: number; description?: string; imageUrl?: string | null; sortOrder?: number }): Promise<number>
updateMenuItem(id: number, patch: Partial<Omit<HomeMenuItem, "id">>): Promise<void>
deleteMenuItem(id: number): Promise<void>
getMonthEvents(month: string): Promise<HomePost[]> // 해당 월과 기간이 겹치는 published 이벤트
```

- [ ] **Step 1: 타입 파일 작성** — 위 `src/types/home.ts` 그대로 생성.

- [ ] **Step 2: 서비스 구현**

`src/services/homeContentService.ts` (스니펫이 아니라 전체 함수 구현. row→DTO 매핑 함수를 두고 각 함수는 supabase 쿼리 + 에러 시 `throw new Error(error.message)` — 기존 서비스 파일 컨벤션은 `src/services/stickerService.ts` 참고):

```ts
import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import type {
  HomeMenuItem,
  HomePost,
  HomePostType,
  HomeScheduleEntry,
  HomeStaff,
} from "@/types/home";

// ── row → DTO 매핑 ──────────────────────────────────────────
interface PostRow {
  id: number; type: HomePostType; title: string; body_md: string;
  cover_image_url: string | null; pinned: boolean; published: boolean;
  published_at: string; event_start_date: string | null; event_end_date: string | null;
}
const POST_COLS =
  "id, type, title, body_md, cover_image_url, pinned, published, published_at, event_start_date, event_end_date";

function mapPost(r: PostRow): HomePost {
  return {
    id: r.id, type: r.type, title: r.title, bodyMd: r.body_md,
    coverImageUrl: r.cover_image_url, pinned: r.pinned, published: r.published,
    publishedAt: r.published_at, eventStartDate: r.event_start_date,
    eventEndDate: r.event_end_date,
  };
}

export async function listPosts(opts?: {
  type?: HomePostType; includeUnpublished?: boolean; limit?: number;
}): Promise<HomePost[]> {
  const supabase = getSupabaseAdmin();
  let q = supabase.from("home_posts").select(POST_COLS)
    .order("pinned", { ascending: false })
    .order("published_at", { ascending: false });
  if (opts?.type) q = q.eq("type", opts.type);
  if (!opts?.includeUnpublished) q = q.eq("published", true);
  if (opts?.limit) q = q.limit(opts.limit);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data as PostRow[]).map(mapPost);
}

export async function getPost(
  id: number, includeUnpublished = false
): Promise<HomePost | null> {
  const supabase = getSupabaseAdmin();
  let q = supabase.from("home_posts").select(POST_COLS).eq("id", id);
  if (!includeUnpublished) q = q.eq("published", true);
  const { data, error } = await q.maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapPost(data as PostRow) : null;
}

export async function createPost(input: {
  type: HomePostType; title: string; bodyMd: string;
  coverImageUrl?: string | null; pinned?: boolean; published?: boolean;
  eventStartDate?: string | null; eventEndDate?: string | null;
}): Promise<number> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from("home_posts").insert({
    type: input.type, title: input.title, body_md: input.bodyMd,
    cover_image_url: input.coverImageUrl ?? null,
    pinned: input.pinned ?? false, published: input.published ?? true,
    event_start_date: input.eventStartDate ?? null,
    event_end_date: input.eventEndDate ?? null,
  }).select("id").single();
  if (error) throw new Error(error.message);
  return (data as { id: number }).id;
}

export async function updatePost(
  id: number,
  patch: Partial<Omit<HomePost, "id" | "publishedAt">>
): Promise<void> {
  const supabase = getSupabaseAdmin();
  const row: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.type !== undefined) row.type = patch.type;
  if (patch.title !== undefined) row.title = patch.title;
  if (patch.bodyMd !== undefined) row.body_md = patch.bodyMd;
  if (patch.coverImageUrl !== undefined) row.cover_image_url = patch.coverImageUrl;
  if (patch.pinned !== undefined) row.pinned = patch.pinned;
  if (patch.published !== undefined) row.published = patch.published;
  if (patch.eventStartDate !== undefined) row.event_start_date = patch.eventStartDate;
  if (patch.eventEndDate !== undefined) row.event_end_date = patch.eventEndDate;
  const { error } = await supabase.from("home_posts").update(row).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deletePost(id: number): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("home_posts").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

// 해당 월(YYYY-MM)과 기간이 겹치는 공개 이벤트 — 달력용
export async function getMonthEvents(month: string): Promise<HomePost[]> {
  const supabase = getSupabaseAdmin();
  const [y, m] = month.split("-").map(Number);
  const monthStart = `${month}-01`;
  const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const monthEnd = `${month}-${String(lastDay).padStart(2, "0")}`;
  // 겹침 조건: start <= 월말 AND coalesce(end, start) >= 월초
  const { data, error } = await supabase.from("home_posts").select(POST_COLS)
    .eq("type", "event").eq("published", true)
    .lte("event_start_date", monthEnd)
    .or(`event_end_date.gte.${monthStart},and(event_end_date.is.null,event_start_date.gte.${monthStart})`);
  if (error) throw new Error(error.message);
  return (data as PostRow[]).map(mapPost);
}
```

이어서 같은 파일에 staff/schedule/menu 부분:

```ts
interface StaffRow {
  id: number; name: string; role: string; photo_url: string | null;
  intro: string; sort_order: number; is_active: boolean;
}
const STAFF_COLS = "id, name, role, photo_url, intro, sort_order, is_active";
function mapStaff(r: StaffRow): HomeStaff {
  return {
    id: r.id, name: r.name, role: r.role, photoUrl: r.photo_url,
    intro: r.intro, sortOrder: r.sort_order, isActive: r.is_active,
  };
}

export async function listStaff(activeOnly: boolean): Promise<HomeStaff[]> {
  const supabase = getSupabaseAdmin();
  let q = supabase.from("home_staff").select(STAFF_COLS)
    .order("sort_order").order("id");
  if (activeOnly) q = q.eq("is_active", true);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data as StaffRow[]).map(mapStaff);
}

export async function createStaff(input: {
  name: string; role?: string; photoUrl?: string | null;
  intro?: string; sortOrder?: number;
}): Promise<number> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from("home_staff").insert({
    name: input.name, role: input.role ?? "", photo_url: input.photoUrl ?? null,
    intro: input.intro ?? "", sort_order: input.sortOrder ?? 0,
  }).select("id").single();
  if (error) throw new Error(error.message);
  return (data as { id: number }).id;
}

export async function updateStaff(
  id: number, patch: Partial<Omit<HomeStaff, "id">>
): Promise<void> {
  const supabase = getSupabaseAdmin();
  const row: Record<string, unknown> = {};
  if (patch.name !== undefined) row.name = patch.name;
  if (patch.role !== undefined) row.role = patch.role;
  if (patch.photoUrl !== undefined) row.photo_url = patch.photoUrl;
  if (patch.intro !== undefined) row.intro = patch.intro;
  if (patch.sortOrder !== undefined) row.sort_order = patch.sortOrder;
  if (patch.isActive !== undefined) row.is_active = patch.isActive;
  const { error } = await supabase.from("home_staff").update(row).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteStaff(id: number): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("home_staff").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

interface ScheduleRow {
  id: number; work_date: string; staff_id: number; start_min: number; end_min: number;
}

export async function listScheduleRange(
  startDate: string, endDate: string
): Promise<HomeScheduleEntry[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from("home_schedule")
    .select("id, work_date, staff_id, start_min, end_min")
    .gte("work_date", startDate).lte("work_date", endDate)
    .order("work_date").order("start_min");
  if (error) throw new Error(error.message);
  return (data as ScheduleRow[]).map((r) => ({
    id: r.id, workDate: r.work_date, staffId: r.staff_id,
    startMin: r.start_min, endMin: r.end_min,
  }));
}

// 그날 출근표 전체 교체 — 어드민 저장 UX가 "하루 단위 저장"이므로 삭제 후 삽입
export async function replaceDaySchedule(
  workDate: string,
  entries: { staffId: number; startMin: number; endMin: number }[]
): Promise<void> {
  const supabase = getSupabaseAdmin();
  const del = await supabase.from("home_schedule").delete().eq("work_date", workDate);
  if (del.error) throw new Error(del.error.message);
  if (entries.length === 0) return;
  const { error } = await supabase.from("home_schedule").insert(
    entries.map((e) => ({
      work_date: workDate, staff_id: e.staffId,
      start_min: e.startMin, end_min: e.endMin,
    }))
  );
  if (error) throw new Error(error.message);
}

interface MenuRow {
  id: number; category: string; name: string; price: number;
  description: string; image_url: string | null; sort_order: number; is_sold_out: boolean;
}

export async function listMenu(): Promise<HomeMenuItem[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from("home_menu_items")
    .select("id, category, name, price, description, image_url, sort_order, is_sold_out")
    .order("category").order("sort_order").order("id");
  if (error) throw new Error(error.message);
  return (data as MenuRow[]).map((r) => ({
    id: r.id, category: r.category, name: r.name, price: r.price,
    description: r.description, imageUrl: r.image_url,
    sortOrder: r.sort_order, isSoldOut: r.is_sold_out,
  }));
}

export async function createMenuItem(input: {
  category: string; name: string; price: number;
  description?: string; imageUrl?: string | null; sortOrder?: number;
}): Promise<number> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from("home_menu_items").insert({
    category: input.category, name: input.name, price: input.price,
    description: input.description ?? "", image_url: input.imageUrl ?? null,
    sort_order: input.sortOrder ?? 0,
  }).select("id").single();
  if (error) throw new Error(error.message);
  return (data as { id: number }).id;
}

export async function updateMenuItem(
  id: number, patch: Partial<Omit<HomeMenuItem, "id">>
): Promise<void> {
  const supabase = getSupabaseAdmin();
  const row: Record<string, unknown> = {};
  if (patch.category !== undefined) row.category = patch.category;
  if (patch.name !== undefined) row.name = patch.name;
  if (patch.price !== undefined) row.price = patch.price;
  if (patch.description !== undefined) row.description = patch.description;
  if (patch.imageUrl !== undefined) row.image_url = patch.imageUrl;
  if (patch.sortOrder !== undefined) row.sort_order = patch.sortOrder;
  if (patch.isSoldOut !== undefined) row.is_sold_out = patch.isSoldOut;
  const { error } = await supabase.from("home_menu_items").update(row).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteMenuItem(id: number): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("home_menu_items").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
```

- [ ] **Step 3: 타입 검증 + 커밋**

```bash
cd /Users/jefflee/workspace/naraka-home-wt && npx tsc --noEmit && npx eslint src/types/home.ts src/services/homeContentService.ts
git add src/types/home.ts src/services/homeContentService.ts
git commit -m "feat: 홈 콘텐츠 타입·서비스 레이어 (글/스태프/출근표/메뉴 CRUD·월 이벤트 조회)"
```

---

### Task 6: 어드민 API (홈 콘텐츠 CRUD + 이미지 업로드)

**Files:**
- Create: `src/app/api/admin/home/posts/route.ts`, `src/app/api/admin/home/posts/[id]/route.ts`, `src/app/api/admin/home/staff/route.ts`, `src/app/api/admin/home/staff/[id]/route.ts`, `src/app/api/admin/home/menu/route.ts`, `src/app/api/admin/home/menu/[id]/route.ts`, `src/app/api/admin/home/schedule/route.ts`, `src/app/api/admin/home/upload/route.ts`

**Interfaces:**
- Consumes: Task 5 서비스 함수 전부, `requireAdmin`, `apiOk`/`apiError`/`handleApiError`
- Produces (어드민 UI가 호출하는 계약 — 전부 `ApiResponse<T>` 래퍼):
  - `GET /api/admin/home/posts` → `{ posts: HomePost[] }` (미공개 포함) / `POST` body `{ type, title, bodyMd, coverImageUrl?, pinned?, published?, eventStartDate?, eventEndDate? }` → `{ id }`
  - `PATCH /api/admin/home/posts/:id` body = 부분 갱신 / `DELETE` → `{ ok: true }`
  - staff·menu 동일 패턴 (`{ staff: HomeStaff[] }`, `{ items: HomeMenuItem[] }`)
  - `GET /api/admin/home/schedule?start=YYYY-MM-DD&end=YYYY-MM-DD` → `{ entries: HomeScheduleEntry[] }` / `PUT` body `{ workDate, entries: [{ staffId, startMin, endMin }] }` → `{ ok: true }`
  - `POST /api/admin/home/upload` (multipart, field `file`) → `{ url }` (공개 URL)

- [ ] **Step 1: posts 라우트 작성**

`src/app/api/admin/home/posts/route.ts` (기존 `src/app/api/admin/stickers/route.ts` 패턴 준수):

```ts
import { z } from "zod";
import { apiError, apiOk, handleApiError } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/guards";
import { createPost, listPosts } from "@/services/homeContentService";

// 어드민 홈 글(공지·이벤트) 관리
export async function GET() {
  try {
    await requireAdmin();
    return apiOk({ posts: await listPosts({ includeUnpublished: true }) });
  } catch (error) {
    return handleApiError(error);
  }
}

const dateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const createSchema = z.object({
  type: z.enum(["notice", "event"]),
  title: z.string().trim().min(1).max(120),
  bodyMd: z.string().max(20000),
  coverImageUrl: z.string().url().nullable().optional(),
  pinned: z.boolean().optional(),
  published: z.boolean().optional(),
  eventStartDate: dateStr.nullable().optional(),
  eventEndDate: dateStr.nullable().optional(),
}).refine((v) => v.type === "notice" || !!v.eventStartDate, {
  message: "이벤트 글은 시작일이 필요합니다.",
});

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const parsed = createSchema.safeParse(await request.json());
    if (!parsed.success) {
      return apiError("VALIDATION", parsed.error.issues[0].message);
    }
    const id = await createPost(parsed.data);
    return apiOk({ id });
  } catch (error) {
    return handleApiError(error);
  }
}
```

`src/app/api/admin/home/posts/[id]/route.ts` (Next 16: params는 Promise):

```ts
import { z } from "zod";
import { apiError, apiOk, handleApiError } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/guards";
import { deletePost, updatePost } from "@/services/homeContentService";

const dateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const patchSchema = z.object({
  type: z.enum(["notice", "event"]).optional(),
  title: z.string().trim().min(1).max(120).optional(),
  bodyMd: z.string().max(20000).optional(),
  coverImageUrl: z.string().url().nullable().optional(),
  pinned: z.boolean().optional(),
  published: z.boolean().optional(),
  eventStartDate: dateStr.nullable().optional(),
  eventEndDate: dateStr.nullable().optional(),
});

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, ctx: Ctx) {
  try {
    await requireAdmin();
    const { id } = await ctx.params;
    const parsed = patchSchema.safeParse(await request.json());
    if (!parsed.success) {
      return apiError("VALIDATION", parsed.error.issues[0].message);
    }
    await updatePost(Number(id), parsed.data);
    return apiOk({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, ctx: Ctx) {
  try {
    await requireAdmin();
    const { id } = await ctx.params;
    await deletePost(Number(id));
    return apiOk({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
```

- [ ] **Step 2: staff·menu 라우트 작성**

같은 구조로 4개 파일. `src/app/api/admin/home/staff/route.ts`:

```ts
import { z } from "zod";
import { apiError, apiOk, handleApiError } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/guards";
import { createStaff, listStaff } from "@/services/homeContentService";

export async function GET() {
  try {
    await requireAdmin();
    return apiOk({ staff: await listStaff(false) });
  } catch (error) {
    return handleApiError(error);
  }
}

const createSchema = z.object({
  name: z.string().trim().min(1).max(40),
  role: z.string().trim().max(40).optional(),
  photoUrl: z.string().url().nullable().optional(),
  intro: z.string().max(500).optional(),
  sortOrder: z.number().int().optional(),
});

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const parsed = createSchema.safeParse(await request.json());
    if (!parsed.success) {
      return apiError("VALIDATION", parsed.error.issues[0].message);
    }
    const id = await createStaff(parsed.data);
    return apiOk({ id });
  } catch (error) {
    return handleApiError(error);
  }
}
```

`src/app/api/admin/home/staff/[id]/route.ts`:

```ts
import { z } from "zod";
import { apiError, apiOk, handleApiError } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/guards";
import { deleteStaff, updateStaff } from "@/services/homeContentService";

const patchSchema = z.object({
  name: z.string().trim().min(1).max(40).optional(),
  role: z.string().trim().max(40).optional(),
  photoUrl: z.string().url().nullable().optional(),
  intro: z.string().max(500).optional(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, ctx: Ctx) {
  try {
    await requireAdmin();
    const { id } = await ctx.params;
    const parsed = patchSchema.safeParse(await request.json());
    if (!parsed.success) {
      return apiError("VALIDATION", parsed.error.issues[0].message);
    }
    await updateStaff(Number(id), parsed.data);
    return apiOk({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, ctx: Ctx) {
  try {
    await requireAdmin();
    const { id } = await ctx.params;
    await deleteStaff(Number(id));
    return apiOk({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
```

`src/app/api/admin/home/menu/route.ts`:

```ts
import { z } from "zod";
import { apiError, apiOk, handleApiError } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/guards";
import { createMenuItem, listMenu } from "@/services/homeContentService";

export async function GET() {
  try {
    await requireAdmin();
    return apiOk({ items: await listMenu() });
  } catch (error) {
    return handleApiError(error);
  }
}

const createSchema = z.object({
  category: z.string().trim().min(1).max(30),
  name: z.string().trim().min(1).max(60),
  price: z.number().int().min(0),
  description: z.string().max(300).optional(),
  imageUrl: z.string().url().nullable().optional(),
  sortOrder: z.number().int().optional(),
});

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const parsed = createSchema.safeParse(await request.json());
    if (!parsed.success) {
      return apiError("VALIDATION", parsed.error.issues[0].message);
    }
    const id = await createMenuItem(parsed.data);
    return apiOk({ id });
  } catch (error) {
    return handleApiError(error);
  }
}
```

`src/app/api/admin/home/menu/[id]/route.ts`:

```ts
import { z } from "zod";
import { apiError, apiOk, handleApiError } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/guards";
import { deleteMenuItem, updateMenuItem } from "@/services/homeContentService";

const patchSchema = z.object({
  category: z.string().trim().min(1).max(30).optional(),
  name: z.string().trim().min(1).max(60).optional(),
  price: z.number().int().min(0).optional(),
  description: z.string().max(300).optional(),
  imageUrl: z.string().url().nullable().optional(),
  sortOrder: z.number().int().optional(),
  isSoldOut: z.boolean().optional(),
});

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, ctx: Ctx) {
  try {
    await requireAdmin();
    const { id } = await ctx.params;
    const parsed = patchSchema.safeParse(await request.json());
    if (!parsed.success) {
      return apiError("VALIDATION", parsed.error.issues[0].message);
    }
    await updateMenuItem(Number(id), parsed.data);
    return apiOk({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, ctx: Ctx) {
  try {
    await requireAdmin();
    const { id } = await ctx.params;
    await deleteMenuItem(Number(id));
    return apiOk({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
```

- [ ] **Step 3: schedule·upload 라우트 작성**

`src/app/api/admin/home/schedule/route.ts`:

```ts
import { z } from "zod";
import { apiError, apiOk, handleApiError } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/guards";
import { listScheduleRange, replaceDaySchedule } from "@/services/homeContentService";

const dateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const url = new URL(request.url);
    const parsed = z.object({ start: dateStr, end: dateStr }).safeParse({
      start: url.searchParams.get("start"),
      end: url.searchParams.get("end"),
    });
    if (!parsed.success) {
      return apiError("VALIDATION", "start·end 날짜(YYYY-MM-DD)가 필요합니다.");
    }
    return apiOk({
      entries: await listScheduleRange(parsed.data.start, parsed.data.end),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

const putSchema = z.object({
  workDate: dateStr,
  entries: z.array(z.object({
    staffId: z.number().int().positive(),
    startMin: z.number().int().min(0).max(1439),
    endMin: z.number().int().min(1).max(1440),
  }).refine((e) => e.endMin > e.startMin, { message: "종료가 시작보다 빨라요." })).max(50),
});

// 하루 단위 전체 교체 저장
export async function PUT(request: Request) {
  try {
    await requireAdmin();
    const parsed = putSchema.safeParse(await request.json());
    if (!parsed.success) {
      return apiError("VALIDATION", parsed.error.issues[0].message);
    }
    await replaceDaySchedule(parsed.data.workDate, parsed.data.entries);
    return apiOk({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
```

`src/app/api/admin/home/upload/route.ts`:

```ts
import { apiError, apiOk, handleApiError } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/guards";
import { getSupabaseAdmin } from "@/lib/supabase/server";

const ALLOWED = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);
const MAX_BYTES = 5 * 1024 * 1024;

// 홈 콘텐츠 이미지 업로드 → home-assets 공개 버킷, 공개 URL 반환
export async function POST(request: Request) {
  try {
    await requireAdmin();
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return apiError("VALIDATION", "file 필드가 필요합니다.");
    }
    const ext = ALLOWED.get(file.type);
    if (!ext) {
      return apiError("VALIDATION", "jpeg·png·webp만 업로드할 수 있습니다.");
    }
    if (file.size > MAX_BYTES) {
      return apiError("VALIDATION", "이미지는 5MB 이하여야 합니다.");
    }
    const supabase = getSupabaseAdmin();
    const path = `${new Date().getFullYear()}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("home-assets")
      .upload(path, file, { contentType: file.type });
    if (error) throw new Error(error.message);
    const { data } = supabase.storage.from("home-assets").getPublicUrl(path);
    return apiOk({ url: data.publicUrl });
  } catch (error) {
    return handleApiError(error);
  }
}
```

- [ ] **Step 4: 비로그인 가드 검증 + 커밋**

```bash
cd /Users/jefflee/workspace/naraka-home-wt && npm run build && npx eslint src/app/api/admin/home
( npm run dev & pid=$!; ( sleep 40; kill -9 $pid 2>/dev/null ) & wd=$!; \
  sleep 12; \
  curl -s localhost:3000/api/admin/home/posts | head -c 200; echo; \
  kill $pid 2>/dev/null; kill $wd 2>/dev/null ); pkill -f "next dev" 2>/dev/null; true
git add src/app/api/admin/home && git commit -m "feat: 어드민 홈 콘텐츠 API (글·스태프·메뉴·출근표·이미지 업로드)"
```
Expected: 빌드 통과, curl 응답이 `{"success":false,"error":{"code":"UNAUTHORIZED"...` (가드 동작 확인)

---

### Task 7: 어드민 UI — 홈페이지 관리 탭

**Files:**
- Create: `src/components/admin/home/HomePostsSection.tsx`, `src/components/admin/home/HomeMenuSection.tsx`, `src/components/admin/home/HomeStaffSection.tsx`, `src/components/admin/home/HomeScheduleSection.tsx`, `src/components/admin/home/adminHomeApi.ts`, `src/components/admin/home/ImageUploadButton.tsx`
- Modify: `src/app/admin/page.tsx` (최상위 탭 "홈페이지" 추가)

**Interfaces:**
- Consumes: Task 6 API 계약 전부
- Produces: 어드민 콘솔에서 홈 콘텐츠 CRUD 가능 (사장님 셀프 서비스)

- [ ] **Step 1: 공용 fetch 헬퍼**

`src/components/admin/home/adminHomeApi.ts`:

```ts
"use client";

import type { ApiResponse } from "@/types/api";

// 어드민 홈 API 공용 fetch — 실패 시 에러 메시지를 throw해 각 섹션이 toast로 표시
export async function adminHomeFetch<T>(
  url: string,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: init?.body instanceof FormData
      ? init?.headers
      : { "Content-Type": "application/json", ...init?.headers },
  });
  const json = (await res.json()) as ApiResponse<T>;
  if (!json.success) throw new Error(json.error.message);
  return json.data;
}
```

- [ ] **Step 2: 이미지 업로드 버튼**

`src/components/admin/home/ImageUploadButton.tsx`:

```tsx
"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { adminHomeFetch } from "./adminHomeApi";

// 파일 선택 → /api/admin/home/upload → 공개 URL 콜백
export function ImageUploadButton({
  onUploaded,
}: {
  onUploaded: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const { url } = await adminHomeFetch<{ url: string }>(
        "/api/admin/home/upload",
        { method: "POST", body: form }
      );
      onUploaded(url);
      toast.success("이미지 업로드 완료");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "업로드 실패");
    } finally {
      setBusy(false);
      e.target.value = "";
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleChange}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
      >
        {busy ? "업로드 중" : "이미지 업로드"}
      </Button>
    </>
  );
}
```

- [ ] **Step 3: 글(공지·이벤트) 섹션**

`src/components/admin/home/HomePostsSection.tsx`:

```tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { HomePost, HomePostType } from "@/types/home";
import { adminHomeFetch } from "./adminHomeApi";
import { ImageUploadButton } from "./ImageUploadButton";

const EMPTY = {
  type: "notice" as HomePostType,
  title: "",
  bodyMd: "",
  coverImageUrl: null as string | null,
  pinned: false,
  eventStartDate: "",
  eventEndDate: "",
};

// 홈 공지·이벤트 작성/목록 — 이벤트는 달력 표시용 날짜 필수
export function HomePostsSection() {
  const [posts, setPosts] = useState<HomePost[]>([]);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    try {
      const { posts } = await adminHomeFetch<{ posts: HomePost[] }>(
        "/api/admin/home/posts"
      );
      setPosts(posts);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "목록 조회 실패");
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  async function submit() {
    if (!form.title.trim()) return toast.error("제목을 입력해주세요.");
    if (form.type === "event" && !form.eventStartDate) {
      return toast.error("이벤트는 시작일이 필요합니다.");
    }
    setBusy(true);
    try {
      const body = {
        type: form.type,
        title: form.title,
        bodyMd: form.bodyMd,
        coverImageUrl: form.coverImageUrl,
        pinned: form.pinned,
        eventStartDate: form.type === "event" ? form.eventStartDate : null,
        eventEndDate:
          form.type === "event" && form.eventEndDate ? form.eventEndDate : null,
      };
      if (editingId === null) {
        await adminHomeFetch("/api/admin/home/posts", {
          method: "POST",
          body: JSON.stringify(body),
        });
      } else {
        await adminHomeFetch(`/api/admin/home/posts/${editingId}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        });
      }
      setForm(EMPTY);
      setEditingId(null);
      toast.success("저장 완료");
      await reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "저장 실패");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: number) {
    try {
      await adminHomeFetch(`/api/admin/home/posts/${id}`, { method: "DELETE" });
      toast.success("삭제 완료");
      await reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "삭제 실패");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardContent className="flex flex-col gap-2 pt-4">
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={form.type === "notice" ? "default" : "outline"}
              onClick={() => setForm({ ...form, type: "notice" })}
            >
              공지
            </Button>
            <Button
              size="sm"
              variant={form.type === "event" ? "default" : "outline"}
              onClick={() => setForm({ ...form, type: "event" })}
            >
              이벤트
            </Button>
            <label className="ml-auto flex items-center gap-1 text-sm">
              <input
                type="checkbox"
                checked={form.pinned}
                onChange={(e) => setForm({ ...form, pinned: e.target.checked })}
              />
              고정
            </label>
          </div>
          <Input
            placeholder="제목"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          {form.type === "event" && (
            <div className="flex items-center gap-2 text-sm">
              <Input
                type="date"
                value={form.eventStartDate}
                onChange={(e) =>
                  setForm({ ...form, eventStartDate: e.target.value })
                }
              />
              <span>~</span>
              <Input
                type="date"
                value={form.eventEndDate}
                onChange={(e) =>
                  setForm({ ...form, eventEndDate: e.target.value })
                }
              />
            </div>
          )}
          <Textarea
            placeholder="본문 (마크다운)"
            rows={6}
            value={form.bodyMd}
            onChange={(e) => setForm({ ...form, bodyMd: e.target.value })}
          />
          <div className="flex items-center gap-2">
            <ImageUploadButton
              onUploaded={(url) => setForm({ ...form, coverImageUrl: url })}
            />
            {form.coverImageUrl && (
              <span className="truncate text-xs text-muted-foreground">
                대표 이미지 첨부됨
              </span>
            )}
            <Button size="sm" className="ml-auto" disabled={busy} onClick={submit}>
              {editingId === null ? "등록" : "수정 저장"}
            </Button>
            {editingId !== null && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setEditingId(null);
                  setForm(EMPTY);
                }}
              >
                취소
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-2">
        {posts.map((p) => (
          <Card key={p.id}>
            <CardContent className="flex items-center gap-2 py-3">
              <Badge variant={p.type === "event" ? "default" : "secondary"}>
                {p.type === "event" ? "이벤트" : "공지"}
              </Badge>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {p.pinned ? "[고정] " : ""}
                  {p.title}
                </p>
                {p.type === "event" && (
                  <p className="text-xs text-muted-foreground">
                    {p.eventStartDate}
                    {p.eventEndDate ? ` ~ ${p.eventEndDate}` : ""}
                  </p>
                )}
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setEditingId(p.id);
                  setForm({
                    type: p.type,
                    title: p.title,
                    bodyMd: p.bodyMd,
                    coverImageUrl: p.coverImageUrl,
                    pinned: p.pinned,
                    eventStartDate: p.eventStartDate ?? "",
                    eventEndDate: p.eventEndDate ?? "",
                  });
                }}
              >
                수정
              </Button>
              <Button size="sm" variant="destructive" onClick={() => remove(p.id)}>
                삭제
              </Button>
            </CardContent>
          </Card>
        ))}
        {posts.length === 0 && (
          <p className="py-4 text-center text-sm text-muted-foreground">
            아직 작성한 글이 없습니다.
          </p>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: 스태프·메뉴 섹션**

`src/components/admin/home/HomeStaffSection.tsx` (같은 목록+폼 패턴 — 필드: 이름·역할·소개·사진 업로드·정렬·활성 토글):

```tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { HomeStaff } from "@/types/home";
import { adminHomeFetch } from "./adminHomeApi";
import { ImageUploadButton } from "./ImageUploadButton";

const EMPTY = { name: "", role: "", intro: "", photoUrl: null as string | null };

export function HomeStaffSection() {
  const [staff, setStaff] = useState<HomeStaff[]>([]);
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    try {
      const data = await adminHomeFetch<{ staff: HomeStaff[] }>(
        "/api/admin/home/staff"
      );
      setStaff(data.staff);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "목록 조회 실패");
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  async function add() {
    if (!form.name.trim()) return toast.error("이름을 입력해주세요.");
    setBusy(true);
    try {
      await adminHomeFetch("/api/admin/home/staff", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setForm(EMPTY);
      toast.success("등록 완료");
      await reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "등록 실패");
    } finally {
      setBusy(false);
    }
  }

  async function patch(id: number, body: Record<string, unknown>) {
    try {
      await adminHomeFetch(`/api/admin/home/staff/${id}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
      await reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "수정 실패");
    }
  }

  async function remove(id: number) {
    try {
      await adminHomeFetch(`/api/admin/home/staff/${id}`, { method: "DELETE" });
      await reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "삭제 실패");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardContent className="flex flex-col gap-2 pt-4">
          <div className="flex gap-2">
            <Input
              placeholder="이름"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <Input
              placeholder="역할 (예: 마녀)"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            />
          </div>
          <Textarea
            placeholder="소개"
            rows={2}
            value={form.intro}
            onChange={(e) => setForm({ ...form, intro: e.target.value })}
          />
          <div className="flex items-center gap-2">
            <ImageUploadButton
              onUploaded={(url) => setForm({ ...form, photoUrl: url })}
            />
            {form.photoUrl && (
              <span className="text-xs text-muted-foreground">사진 첨부됨</span>
            )}
            <Button size="sm" className="ml-auto" disabled={busy} onClick={add}>
              등록
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-2">
        {staff.map((s) => (
          <Card key={s.id}>
            <CardContent className="flex items-center gap-3 py-3">
              {s.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- 어드민 미리보기, 외부 최적화 불필요
                <img
                  src={s.photoUrl}
                  alt={s.name}
                  className="size-10 rounded-full object-cover"
                />
              ) : (
                <div className="flex size-10 items-center justify-center rounded-full bg-muted text-xs">
                  없음
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">
                  {s.name}
                  {s.role ? ` · ${s.role}` : ""}
                  {!s.isActive ? " (숨김)" : ""}
                </p>
                <p className="truncate text-xs text-muted-foreground">{s.intro}</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => patch(s.id, { isActive: !s.isActive })}
              >
                {s.isActive ? "숨기기" : "표시"}
              </Button>
              <Button size="sm" variant="destructive" onClick={() => remove(s.id)}>
                삭제
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

`src/components/admin/home/HomeMenuSection.tsx` (필드: 카테고리·이름·가격·설명·사진·품절 토글 — Staff 섹션과 같은 뼈대):

```tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { HomeMenuItem } from "@/types/home";
import { adminHomeFetch } from "./adminHomeApi";
import { ImageUploadButton } from "./ImageUploadButton";

const EMPTY = {
  category: "",
  name: "",
  price: "",
  description: "",
  imageUrl: null as string | null,
};

export function HomeMenuSection() {
  const [items, setItems] = useState<HomeMenuItem[]>([]);
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    try {
      const data = await adminHomeFetch<{ items: HomeMenuItem[] }>(
        "/api/admin/home/menu"
      );
      setItems(data.items);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "목록 조회 실패");
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  async function add() {
    const price = Number(form.price);
    if (!form.category.trim() || !form.name.trim()) {
      return toast.error("카테고리와 이름을 입력해주세요.");
    }
    if (!Number.isInteger(price) || price < 0) {
      return toast.error("가격은 0 이상의 정수(원)여야 합니다.");
    }
    setBusy(true);
    try {
      await adminHomeFetch("/api/admin/home/menu", {
        method: "POST",
        body: JSON.stringify({
          category: form.category,
          name: form.name,
          price,
          description: form.description,
          imageUrl: form.imageUrl,
        }),
      });
      setForm(EMPTY);
      toast.success("등록 완료");
      await reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "등록 실패");
    } finally {
      setBusy(false);
    }
  }

  async function patch(id: number, body: Record<string, unknown>) {
    try {
      await adminHomeFetch(`/api/admin/home/menu/${id}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
      await reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "수정 실패");
    }
  }

  async function remove(id: number) {
    try {
      await adminHomeFetch(`/api/admin/home/menu/${id}`, { method: "DELETE" });
      await reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "삭제 실패");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardContent className="flex flex-col gap-2 pt-4">
          <div className="flex gap-2">
            <Input
              placeholder="카테고리 (예: 디저트)"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            />
            <Input
              placeholder="이름"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <Input
              placeholder="가격(원)"
              inputMode="numeric"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
            />
          </div>
          <Input
            placeholder="설명"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <div className="flex items-center gap-2">
            <ImageUploadButton
              onUploaded={(url) => setForm({ ...form, imageUrl: url })}
            />
            {form.imageUrl && (
              <span className="text-xs text-muted-foreground">사진 첨부됨</span>
            )}
            <Button size="sm" className="ml-auto" disabled={busy} onClick={add}>
              등록
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-2">
        {items.map((it) => (
          <Card key={it.id}>
            <CardContent className="flex items-center gap-2 py-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">
                  [{it.category}] {it.name} · {it.price.toLocaleString("ko-KR")}원
                  {it.isSoldOut ? " (품절)" : ""}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {it.description}
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => patch(it.id, { isSoldOut: !it.isSoldOut })}
              >
                {it.isSoldOut ? "판매 재개" : "품절"}
              </Button>
              <Button size="sm" variant="destructive" onClick={() => remove(it.id)}>
                삭제
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 5: 출근표 섹션**

`src/components/admin/home/HomeScheduleSection.tsx` — 날짜 선택 → 스태프별 시간대 행 추가 → 하루 단위 저장(PUT):

```tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { HomeScheduleEntry, HomeStaff } from "@/types/home";
import { adminHomeFetch } from "./adminHomeApi";

interface DraftEntry {
  staffId: number;
  start: string; // "HH:MM"
  end: string;   // "HH:MM" (24:00 허용)
}

function toMin(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function toHhmm(min: number): string {
  return `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
}

// 출근표 — 하루 단위로 스태프×시간대 행을 편집하고 통째로 저장한다
export function HomeScheduleSection() {
  const [staff, setStaff] = useState<HomeStaff[]>([]);
  const [date, setDate] = useState("");
  const [rows, setRows] = useState<DraftEntry[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const data = await adminHomeFetch<{ staff: HomeStaff[] }>(
          "/api/admin/home/staff"
        );
        setStaff(data.staff.filter((s) => s.isActive));
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "스태프 조회 실패");
      }
    })();
  }, []);

  const loadDay = useCallback(async (d: string) => {
    try {
      const data = await adminHomeFetch<{ entries: HomeScheduleEntry[] }>(
        `/api/admin/home/schedule?start=${d}&end=${d}`
      );
      setRows(
        data.entries.map((e) => ({
          staffId: e.staffId,
          start: toHhmm(e.startMin),
          end: toHhmm(e.endMin),
        }))
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "출근표 조회 실패");
    }
  }, []);

  useEffect(() => {
    if (date) void loadDay(date);
  }, [date, loadDay]);

  async function save() {
    if (!date) return toast.error("날짜를 선택해주세요.");
    setBusy(true);
    try {
      await adminHomeFetch("/api/admin/home/schedule", {
        method: "PUT",
        body: JSON.stringify({
          workDate: date,
          entries: rows.map((r) => ({
            staffId: r.staffId,
            startMin: toMin(r.start),
            endMin: toMin(r.end),
          })),
        }),
      });
      toast.success("출근표 저장 완료");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "저장 실패");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 pt-4">
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        {date && (
          <>
            {rows.map((row, i) => (
              <div key={i} className="flex items-center gap-2">
                <select
                  className="h-9 flex-1 rounded-md border bg-transparent px-2 text-sm"
                  value={row.staffId}
                  onChange={(e) => {
                    const next = [...rows];
                    next[i] = { ...row, staffId: Number(e.target.value) };
                    setRows(next);
                  }}
                >
                  {staff.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                <Input
                  type="time"
                  className="w-28"
                  value={row.start}
                  onChange={(e) => {
                    const next = [...rows];
                    next[i] = { ...row, start: e.target.value };
                    setRows(next);
                  }}
                />
                <span className="text-sm">~</span>
                <Input
                  type="time"
                  className="w-28"
                  value={row.end}
                  onChange={(e) => {
                    const next = [...rows];
                    next[i] = { ...row, end: e.target.value };
                    setRows(next);
                  }}
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setRows(rows.filter((_, j) => j !== i))}
                >
                  제거
                </Button>
              </div>
            ))}
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={staff.length === 0}
                onClick={() =>
                  setRows([
                    ...rows,
                    { staffId: staff[0].id, start: "12:00", end: "18:00" },
                  ])
                }
              >
                출근 추가
              </Button>
              <Button size="sm" className="ml-auto" disabled={busy} onClick={save}>
                이 날짜 저장
              </Button>
            </div>
            {staff.length === 0 && (
              <p className="text-xs text-muted-foreground">
                먼저 스태프를 등록해주세요.
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 6: 어드민 페이지에 탭 연결**

`src/app/admin/page.tsx` 최상위 `TabsList`에 `<TabsTrigger value="home">홈페이지</TabsTrigger>` 추가, 대응 컨텐츠:

```tsx
<TabsContent value="home">
  <Tabs defaultValue="posts">
    <TabsList className="w-full">
      <TabsTrigger value="posts">공지·이벤트</TabsTrigger>
      <TabsTrigger value="schedule">출근표</TabsTrigger>
      <TabsTrigger value="staff">스태프</TabsTrigger>
      <TabsTrigger value="menu">메뉴</TabsTrigger>
    </TabsList>
    <TabsContent value="posts"><HomePostsSection /></TabsContent>
    <TabsContent value="schedule"><HomeScheduleSection /></TabsContent>
    <TabsContent value="staff"><HomeStaffSection /></TabsContent>
    <TabsContent value="menu"><HomeMenuSection /></TabsContent>
  </Tabs>
</TabsContent>
```

임포트 4종 추가 (`@/components/admin/home/...`). 기존 탭 6개 초과로 좁아지면 `TabsList`에 `overflow-x-auto` 추가.

- [ ] **Step 7: 빌드·커밋**

```bash
cd /Users/jefflee/workspace/naraka-home-wt && npm run build && npx eslint src/components/admin/home src/app/admin
git add src/components/admin/home src/app/admin/page.tsx
git commit -m "feat: 어드민 홈페이지 관리 탭 (공지·이벤트/출근표/스태프/메뉴 + 이미지 업로드)"
```

(전체 CRUD 실동작은 Task 12에서 verify 스킬로 로컬 어드민 계정 로그인 후 확인)

---

### Task 8: `(home)` 레이아웃·테마·헤더·푸터

**Files:**
- Create: `src/app/(home)/layout.tsx`, `src/app/(home)/home.css`, `src/components/home/HomeHeader.tsx`, `src/components/home/HomeFooter.tsx`, `src/lib/homeConfig.ts`, `src/app/(home)/page.tsx` (뼈대 — Task 9에서 완성)

**Interfaces:**
- Produces: 홈 구역 공통 크롬 + `HOME_INFO` 상수 (`src/lib/homeConfig.ts`) — 서브페이지들이 사용
- `HOME_NAV: { href: string; label: string }[]` — 7탭 정의 (HomeHeader 내부)

- [ ] **Step 1: 홈 설정 상수**

`src/lib/homeConfig.ts`:

```ts
// 카페 홈 공통 정보 — 사장님 확인값으로 교체할 수 있는 단일 지점
export const HOME_INFO = {
  name: "나라카",
  tagline: "요괴들의 도시, 나라카에 오신 것을 환영합니다",
  addressLine: "대구 중구 동성로", // 상세 주소는 사장님 제공 시 교체
  hoursNote: "영업시간과 휴무일은 인스타그램 공지를 확인해주세요",
  instagramHandle: "naraka_concafe",
  instagramUrl: "https://instagram.com/naraka_concafe",
  // 예약은 외부 채널로 — 자체 예약 시스템 없음 (스펙 §7)
  reserveUrl: "https://instagram.com/naraka_concafe",
} as const;
```

- [ ] **Step 2: 홈 팔레트 CSS**

`src/app/(home)/home.css` — 앤틱 레트로 팔레트(버건디·크림·앰버). `.home-scope`로 스코프해 next-themes 다크 토글과 무관하게 단일 룩:

```css
/* 카페 홈 전용 팔레트 — 앤틱 레트로 (원화 무드: 버건디·크림·앰버·먹색) */
.home-scope {
  --home-bg: #f7efe2;        /* 밝은 크림 한지 */
  --home-surface: #fdf8ee;
  --home-ink: #2b1d1a;       /* 먹색에 가까운 진갈색 */
  --home-muted: #7a6a5c;
  --home-burgundy: #7c2231;  /* 커튼 버건디 */
  --home-amber: #b97f2e;     /* 앰버 골드 */
  --home-line: #e2d5bd;
  background: var(--home-bg);
  color: var(--home-ink);
}
.home-scope a {
  color: inherit;
}
```

- [ ] **Step 3: 헤더·푸터**

`src/components/home/HomeHeader.tsx` (서버 컴포넌트 — 활성 표시는 생략해 단순화, 모바일은 가로 스크롤 내비):

```tsx
import Link from "next/link";
import { HOME_INFO } from "@/lib/homeConfig";

const HOME_NAV = [
  { href: "/", label: "홈" },
  { href: "/about", label: "소개" },
  { href: "/location", label: "오시는 길" },
  { href: "/menu", label: "메뉴" },
  { href: "/staff", label: "스태프" },
  { href: "/notice", label: "공지" },
  { href: "/events", label: "이벤트" },
  { href: "/games", label: "게임" },
] as const;

// 카페 홈 고정 헤더 — 어느 페이지에서든 모든 탭 1클릭 (스크럽 여정 UX 안전장치)
export function HomeHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--home-line)] bg-[var(--home-surface)]/95 backdrop-blur">
      <div className="mx-auto flex max-w-3xl items-center gap-4 px-4 py-3">
        <Link href="/" className="shrink-0 text-lg font-bold tracking-widest">
          {HOME_INFO.name}
        </Link>
        <nav className="scrollbar-none flex gap-4 overflow-x-auto text-sm">
          {HOME_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="shrink-0 py-1 hover:text-[var(--home-burgundy)]"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
```

`src/components/home/HomeFooter.tsx`:

```tsx
import { HOME_INFO } from "@/lib/homeConfig";

export function HomeFooter() {
  return (
    <footer className="mt-12 border-t border-[var(--home-line)] bg-[var(--home-surface)]">
      <div className="mx-auto flex max-w-3xl flex-col gap-1 px-4 py-8 text-sm text-[var(--home-muted)]">
        <p className="font-semibold text-[var(--home-ink)]">{HOME_INFO.name}</p>
        <p>{HOME_INFO.addressLine}</p>
        <p>{HOME_INFO.hoursNote}</p>
        <a
          href={HOME_INFO.instagramUrl}
          target="_blank"
          rel="noreferrer"
          className="underline underline-offset-2"
        >
          instagram @{HOME_INFO.instagramHandle}
        </a>
      </div>
    </footer>
  );
}
```

- [ ] **Step 4: (home) 레이아웃 + 뼈대 페이지**

`src/app/(home)/layout.tsx`:

```tsx
import "./home.css";
import { HomeFooter } from "@/components/home/HomeFooter";
import { HomeHeader } from "@/components/home/HomeHeader";

// 카페 홈 구역 크롬 — 앤틱 레트로 팔레트는 .home-scope로 스코프 (주식앱 테마와 독립)
export default function HomeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="home-scope flex min-h-dvh flex-col">
      <HomeHeader />
      <div className="flex-1">{children}</div>
      <HomeFooter />
    </div>
  );
}
```

`src/app/(home)/page.tsx` (뼈대 — Task 9·11에서 섹션 완성):

```tsx
import { HOME_INFO } from "@/lib/homeConfig";

export default function HomePage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-bold">{HOME_INFO.name}</h1>
      <p className="mt-2 text-[var(--home-muted)]">{HOME_INFO.tagline}</p>
    </main>
  );
}
```

- [ ] **Step 5: 빌드·스모크·커밋**

```bash
cd /Users/jefflee/workspace/naraka-home-wt && npm run build && npx eslint src
( npm run dev & pid=$!; ( sleep 40; kill -9 $pid 2>/dev/null ) & wd=$!; \
  sleep 12; echo "root: $(curl -s -o /dev/null -w '%{http_code}' localhost:3000/)"; \
  kill $pid 2>/dev/null; kill $wd 2>/dev/null ); pkill -f "next dev" 2>/dev/null; true
git add "src/app/(home)" src/components/home src/lib/homeConfig.ts
git commit -m "feat: 카페 홈 구역 레이아웃·앤틱 팔레트·헤더 7탭·푸터"
```
Expected: `root: 200`

---

### Task 9: 달력·출근표 컴포넌트 + 홈 페이지 조립

**Files:**
- Create: `src/components/home/CalendarSection.tsx` (클라이언트), `src/components/home/StaffAvatar.tsx`
- Modify: `src/app/(home)/page.tsx`

**Interfaces:**
- Consumes: `buildMonthGrid`/`formatMinute`/`shiftMonth` (Task 4), `getMonthEvents`/`listScheduleRange`/`listStaff`/`listPosts` (Task 5), `getKstParts` (`@/lib/market`)
- Produces: `CalendarSection` props — `{ month: string; weeks: CalendarDayCell[][]; staff: HomeStaff[]; daySchedule: Record<string, HomeScheduleEntry[]> }` (전부 직렬화 가능 값, RSC → 클라이언트 경계)

- [ ] **Step 1: 스태프 아바타**

`src/components/home/StaffAvatar.tsx`:

```tsx
import type { HomeStaff } from "@/types/home";

// 출근표용 소형 아바타 — 사진 없으면 이름 첫 글자
export function StaffAvatar({ staff, size = 24 }: { staff: HomeStaff; size?: number }) {
  if (staff.photoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- 소형 아바타, 원격 최적화 불필요
      <img
        src={staff.photoUrl}
        alt={staff.name}
        width={size}
        height={size}
        className="rounded-full border border-[var(--home-line)] object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      className="flex items-center justify-center rounded-full bg-[var(--home-burgundy)] text-[10px] font-bold text-[var(--home-surface)]"
      style={{ width: size, height: size }}
    >
      {staff.name.slice(0, 1)}
    </span>
  );
}
```

- [ ] **Step 2: 달력 섹션 (클라이언트)**

`src/components/home/CalendarSection.tsx` — 월 그리드 + 날짜 클릭 시 하단 상세(이벤트 + 시간대별 출근 타임라인). 월 이동은 링크(`/?month=YYYY-MM#calendar`)로 서버 재렌더:

```tsx
"use client";

import Link from "next/link";
import { useState } from "react";
import {
  formatMinute,
  shiftMonth,
  type CalendarDayCell,
} from "@/lib/homeCalendar";
import type { HomeScheduleEntry, HomeStaff } from "@/types/home";
import { StaffAvatar } from "./StaffAvatar";

const WEEKDAYS = ["월", "화", "수", "목", "금", "토", "일"];

interface Props {
  month: string;
  weeks: CalendarDayCell[][];
  staff: HomeStaff[];
  daySchedule: Record<string, HomeScheduleEntry[]>;
}

// 이벤트 달력 + 요괴 출근표 (여정의 종착지이자 홈 핵심 정보)
export function CalendarSection({ month, weeks, staff, daySchedule }: Props) {
  const staffById = new Map(staff.map((s) => [s.id, s]));
  const today = weeks.flat().find((c) => c.isToday);
  const [selected, setSelected] = useState<string | null>(today?.date ?? null);
  const selectedCell = weeks.flat().find((c) => c.date === selected) ?? null;
  const selectedEntries = selected ? (daySchedule[selected] ?? []) : [];

  return (
    <section id="calendar" className="mx-auto max-w-3xl px-4 py-10">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">이번 달의 나라카</h2>
        <div className="flex items-center gap-3 text-sm">
          <Link href={`/?month=${shiftMonth(month, -1)}#calendar`}>이전 달</Link>
          <span className="font-semibold">{month.replace("-", ".")}</span>
          <Link href={`/?month=${shiftMonth(month, 1)}#calendar`}>다음 달</Link>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-1 text-center text-xs text-[var(--home-muted)]">
        {WEEKDAYS.map((d) => (
          <div key={d} className="py-1">{d}</div>
        ))}
      </div>
      {weeks.map((week, wi) => (
        <div key={wi} className="grid grid-cols-7 gap-1">
          {week.map((cell) => (
            <button
              key={cell.date}
              type="button"
              onClick={() => setSelected(cell.date)}
              className={[
                "flex min-h-16 flex-col items-start gap-1 rounded-md border p-1 text-left",
                cell.inMonth
                  ? "border-[var(--home-line)] bg-[var(--home-surface)]"
                  : "border-transparent opacity-40",
                cell.isToday ? "ring-2 ring-[var(--home-amber)]" : "",
                selected === cell.date ? "border-[var(--home-burgundy)]" : "",
              ].join(" ")}
            >
              <span className="text-xs">{Number(cell.date.slice(8))}</span>
              {cell.events.length > 0 && (
                <span className="max-w-full truncate rounded bg-[var(--home-burgundy)] px-1 text-[10px] text-[var(--home-surface)]">
                  {cell.events[0].title}
                  {cell.events.length > 1 ? ` 외 ${cell.events.length - 1}` : ""}
                </span>
              )}
              {cell.staffIds.length > 0 && (
                <span className="flex -space-x-1">
                  {cell.staffIds.slice(0, 4).map((id) => {
                    const s = staffById.get(id);
                    return s ? <StaffAvatar key={id} staff={s} size={18} /> : null;
                  })}
                </span>
              )}
            </button>
          ))}
        </div>
      ))}

      {selectedCell && (
        <div className="mt-4 rounded-lg border border-[var(--home-line)] bg-[var(--home-surface)] p-4">
          <h3 className="font-semibold">
            {selectedCell.date.replaceAll("-", ".")}
            {selectedCell.isToday ? " (오늘)" : ""}
          </h3>
          <div className="mt-2 flex flex-col gap-1 text-sm">
            {selectedCell.events.map((ev) => (
              <Link
                key={ev.id}
                href={`/events/${ev.id}`}
                className="text-[var(--home-burgundy)] underline underline-offset-2"
              >
                {ev.title}
              </Link>
            ))}
            {selectedCell.events.length === 0 && (
              <p className="text-[var(--home-muted)]">예정된 이벤트가 없습니다.</p>
            )}
          </div>
          <h4 className="mt-3 text-sm font-semibold">출근 요괴</h4>
          <div className="mt-1 flex flex-col gap-1 text-sm">
            {selectedEntries.map((e) => {
              const s = staffById.get(e.staffId);
              if (!s) return null;
              return (
                <div key={e.id} className="flex items-center gap-2">
                  <StaffAvatar staff={s} />
                  <span>{s.name}</span>
                  <span className="ml-auto tabular-nums text-[var(--home-muted)]">
                    {formatMinute(e.startMin)} ~ {formatMinute(e.endMin)}
                  </span>
                </div>
              );
            })}
            {selectedEntries.length === 0 && (
              <p className="text-[var(--home-muted)]">출근 정보가 아직 없습니다.</p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
```

- [ ] **Step 3: 홈 페이지 조립 (RSC)**

`src/app/(home)/page.tsx` 교체 — searchParams는 Promise(`await`), 달력 데이터 + 최신 소식 + 오시는 길 요약:

```tsx
import Link from "next/link";
import { CalendarSection } from "@/components/home/CalendarSection";
import { buildMonthGrid } from "@/lib/homeCalendar";
import { HOME_INFO } from "@/lib/homeConfig";
import { getKstParts } from "@/lib/market";
import {
  getMonthEvents,
  listPosts,
  listScheduleRange,
  listStaff,
} from "@/services/homeContentService";
import type { HomeScheduleEntry } from "@/types/home";

export const dynamic = "force-dynamic";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { month: rawMonth } = await searchParams;
  const today = getKstParts().date;
  const month = /^\d{4}-\d{2}$/.test(rawMonth ?? "")
    ? (rawMonth as string)
    : today.slice(0, 7);

  const [y, m] = month.split("-").map(Number);
  const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const [events, schedule, staff, latest] = await Promise.all([
    getMonthEvents(month),
    listScheduleRange(`${month}-01`, `${month}-${String(lastDay).padStart(2, "0")}`),
    listStaff(true),
    listPosts({ limit: 5 }),
  ]);

  const weeks = buildMonthGrid(
    month,
    today,
    events.map((e) => ({
      id: e.id,
      title: e.title,
      startDate: e.eventStartDate ?? today,
      endDate: e.eventEndDate,
    })),
    schedule
  );
  const daySchedule: Record<string, HomeScheduleEntry[]> = {};
  for (const entry of schedule) {
    (daySchedule[entry.workDate] ??= []).push(entry);
  }

  return (
    <main>
      {/* Task 11에서 이 자리에 스크럽 여정 히어로가 들어간다 */}
      <section className="mx-auto max-w-3xl px-4 pt-12 text-center">
        <h1 className="text-3xl font-bold tracking-widest">{HOME_INFO.name}</h1>
        <p className="mt-2 text-[var(--home-muted)]">{HOME_INFO.tagline}</p>
      </section>

      <CalendarSection
        month={month}
        weeks={weeks}
        staff={staff}
        daySchedule={daySchedule}
      />

      <section className="mx-auto max-w-3xl px-4 py-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">새 소식</h2>
          <Link href="/notice" className="text-sm underline underline-offset-2">
            전체 보기
          </Link>
        </div>
        <ul className="mt-3 flex flex-col gap-2">
          {latest.map((p) => (
            <li key={p.id}>
              <Link
                href={p.type === "event" ? `/events/${p.id}` : `/notice/${p.id}`}
                className="flex items-baseline gap-2"
              >
                <span className="shrink-0 text-xs text-[var(--home-burgundy)]">
                  {p.type === "event" ? "이벤트" : "공지"}
                </span>
                <span className="truncate">{p.title}</span>
                <span className="ml-auto shrink-0 text-xs text-[var(--home-muted)]">
                  {p.publishedAt.slice(0, 10)}
                </span>
              </Link>
            </li>
          ))}
          {latest.length === 0 && (
            <li className="text-sm text-[var(--home-muted)]">
              아직 등록된 소식이 없습니다.
            </li>
          )}
        </ul>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-6">
        <h2 className="text-xl font-bold">오시는 길</h2>
        <p className="mt-2 text-sm text-[var(--home-muted)]">
          {HOME_INFO.addressLine} · {HOME_INFO.hoursNote}
        </p>
        <Link href="/location" className="text-sm underline underline-offset-2">
          자세히 보기
        </Link>
      </section>
    </main>
  );
}
```

- [ ] **Step 4: 시드 데이터로 육안 확인 + 커밋**

```bash
cd /Users/jefflee/workspace/naraka-home-wt
PGURL="postgresql://postgres:postgres@127.0.0.1:54322/postgres"
psql "$PGURL" -c "insert into home_staff (name, role) values ('옥자','마녀'),('미호','구미호'),('멜','강시'),('바나','뱀파이어');"
psql "$PGURL" -c "insert into home_posts (type,title,body_md,event_start_date,event_end_date,pinned) values ('event','나라카증권 모의 주식','8월 한 달간 진행','2026-08-01','2026-08-30',true),('notice','홈페이지 오픈 안내','나라카 공식 홈페이지가 열렸습니다',null,null,false);"
psql "$PGURL" -c "insert into home_schedule (work_date,staff_id,start_min,end_min) select '2026-08-24', id, 720, 1080 from home_staff limit 2;"
npm run build && npx vitest run
( npm run dev & pid=$!; ( sleep 40; kill -9 $pid 2>/dev/null ) & wd=$!; \
  sleep 12; curl -s localhost:3000/ | grep -o "이번 달의 나라카" | head -1; \
  kill $pid 2>/dev/null; kill $wd 2>/dev/null ); pkill -f "next dev" 2>/dev/null; true
git add "src/app/(home)/page.tsx" src/components/home
git commit -m "feat: 홈 이벤트 달력·요괴 출근표(시간대 분할)·새 소식·오시는 길 섹션"
```
Expected: 테스트 통과, curl 출력에 `이번 달의 나라카`

---

### Task 10: 서브페이지 7종

**Files:**
- Create: `src/app/(home)/about/page.tsx`, `src/app/(home)/location/page.tsx`, `src/app/(home)/menu/page.tsx`, `src/app/(home)/staff/page.tsx`, `src/app/(home)/notice/page.tsx`, `src/app/(home)/notice/[id]/page.tsx`, `src/app/(home)/events/page.tsx`, `src/app/(home)/events/[id]/page.tsx`, `src/app/(home)/games/page.tsx`, `src/components/home/PostBody.tsx`

**Interfaces:**
- Consumes: Task 5 서비스, `HOME_INFO`, react-markdown(신규 의존성)
- Produces: 내비 7탭 전체가 실제 페이지로 동작

- [ ] **Step 1: react-markdown 설치 + 본문 렌더러**

```bash
cd /Users/jefflee/workspace/naraka-home-wt && npm install react-markdown
```

`src/components/home/PostBody.tsx`:

```tsx
import ReactMarkdown from "react-markdown";

// 어드민 작성 마크다운 본문 렌더 (플러그인 없음 — 기본 문법만)
export function PostBody({ markdown }: { markdown: string }) {
  return (
    <div className="prose prose-sm mt-4 max-w-none prose-headings:text-[var(--home-ink)] prose-p:text-[var(--home-ink)]">
      <ReactMarkdown>{markdown}</ReactMarkdown>
    </div>
  );
}
```

(참고: `prose` 클래스가 무스타일이면 — Tailwind v4에 typography 플러그인 미설치 — `whitespace-pre-wrap` 폴백 대신 최소한의 여백만 유지하면 된다. 렌더 확인 후 스타일이 심심하면 `@plugin "@tailwindcss/typography";`를 `globals.css`에 추가하고 devDependency 설치.)

- [ ] **Step 2: 소개·오시는 길·게임 (정적 3종)**

`src/app/(home)/about/page.tsx` (문안은 캐논 준수 — 금지 어휘 없음, 이모지 없음):

```tsx
import type { Metadata } from "next";

export const metadata: Metadata = { title: "소개" };

const CAST = [
  { name: "옥자", role: "마녀 · 나라카의 주인", desc: "한 번도 화내지 않는다. 노려보고, 도장을 찍을 뿐이다." },
  { name: "미호", role: "구미호", desc: "꼬리 아홉 개를 살랑이며 노래한다. 사고를 쳐도 본인만 모른다." },
  { name: "멜", role: "강시", desc: "이마의 부적이 트레이드마크. 돈 이야기에 눈이 커진다." },
  { name: "바나", role: "뱀파이어", desc: "창가 티타임을 좋아한다. 박쥐와 함께 다닌다." },
] as const;

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-bold">나라카 이야기</h1>
      <p className="mt-4 leading-7">
        나라카(奈落)는 지옥을 뜻합니다. 이 카페는 지옥이고, 감옥이고, 직장입니다.
        셋은 같은 곳입니다 — 그게 이 가게의 유일한 농담이자 전부입니다.
      </p>
      <p className="mt-2 leading-7 text-[var(--home-muted)]">
        마녀 사장이 이력서 세 장을 심사했습니다. 지원자들은 전부 사고를 치고
        붙잡혀 감옥에 갇혔는데, 그게 바로 채용이었습니다. 오늘도 요괴들은
        형기를 근속으로 바꿔가며 손님을 맞이합니다.
      </p>
      <h2 className="mt-8 text-xl font-bold">요괴들</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {CAST.map((c) => (
          <div
            key={c.name}
            className="rounded-lg border border-[var(--home-line)] bg-[var(--home-surface)] p-4"
          >
            <p className="font-semibold">{c.name}</p>
            <p className="text-xs text-[var(--home-burgundy)]">{c.role}</p>
            <p className="mt-2 text-sm text-[var(--home-muted)]">{c.desc}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
```

`src/app/(home)/location/page.tsx`:

```tsx
import type { Metadata } from "next";
import { HOME_INFO } from "@/lib/homeConfig";

export const metadata: Metadata = { title: "오시는 길" };

export default function LocationPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-bold">오시는 길</h1>
      <dl className="mt-6 flex flex-col gap-4 text-sm">
        <div>
          <dt className="font-semibold">주소</dt>
          <dd className="mt-1 text-[var(--home-muted)]">{HOME_INFO.addressLine}</dd>
        </div>
        <div>
          <dt className="font-semibold">영업시간</dt>
          <dd className="mt-1 text-[var(--home-muted)]">{HOME_INFO.hoursNote}</dd>
        </div>
        <div>
          <dt className="font-semibold">예약·문의</dt>
          <dd className="mt-1">
            <a
              href={HOME_INFO.reserveUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-block rounded-md bg-[var(--home-burgundy)] px-4 py-2 text-[var(--home-surface)]"
            >
              인스타그램으로 예약·문의하기
            </a>
          </dd>
        </div>
      </dl>
      <p className="mt-8 text-xs text-[var(--home-muted)]">
        지도 안내는 준비 중입니다. 인스타그램 프로필의 위치 정보를 확인해주세요.
      </p>
    </main>
  );
}
```

`src/app/(home)/games/page.tsx` (빈 허브):

```tsx
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "게임" };

// 웹게임 허브 — 게임이 준비되면 이 배열에 추가한다
const GAMES: { href: string; title: string; desc: string }[] = [];

export default function GamesPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-bold">나라카 게임</h1>
      {GAMES.length === 0 ? (
        <div className="mt-10 rounded-lg border border-dashed border-[var(--home-line)] p-10 text-center text-[var(--home-muted)]">
          <p className="font-semibold">준비 중입니다</p>
          <p className="mt-2 text-sm">
            요괴들이 새 게임을 만들고 있어요. 지금은{" "}
            <Link href="/events" className="underline underline-offset-2">
              이벤트 탭
            </Link>
            에서 나라카증권을 즐겨주세요.
          </p>
        </div>
      ) : (
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {GAMES.map((g) => (
            <Link
              key={g.href}
              href={g.href}
              className="rounded-lg border border-[var(--home-line)] bg-[var(--home-surface)] p-4"
            >
              <p className="font-semibold">{g.title}</p>
              <p className="mt-1 text-sm text-[var(--home-muted)]">{g.desc}</p>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
```

- [ ] **Step 3: 메뉴·스태프 (DB 연동 2종)**

`src/app/(home)/menu/page.tsx`:

```tsx
import type { Metadata } from "next";
import { listMenu } from "@/services/homeContentService";

export const metadata: Metadata = { title: "메뉴" };
export const dynamic = "force-dynamic";

export default async function MenuPage() {
  const items = await listMenu();
  const categories = [...new Set(items.map((i) => i.category))];

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-bold">메뉴</h1>
      {categories.length === 0 && (
        <p className="mt-6 text-sm text-[var(--home-muted)]">
          메뉴를 준비 중입니다. 인스타그램에서 미리 만나보세요.
        </p>
      )}
      {categories.map((cat) => (
        <section key={cat} className="mt-8">
          <h2 className="border-b border-[var(--home-line)] pb-2 text-lg font-semibold">
            {cat}
          </h2>
          <ul className="mt-3 flex flex-col gap-3">
            {items
              .filter((i) => i.category === cat)
              .map((i) => (
                <li key={i.id} className="flex items-start gap-3">
                  {i.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element -- Supabase Storage 공개 URL
                    <img
                      src={i.imageUrl}
                      alt={i.name}
                      className="size-16 rounded-md object-cover"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">
                      {i.name}
                      {i.isSoldOut && (
                        <span className="ml-2 text-xs text-[var(--home-burgundy)]">
                          품절
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-[var(--home-muted)]">{i.description}</p>
                  </div>
                  <p className="shrink-0 tabular-nums">
                    {i.price.toLocaleString("ko-KR")}원
                  </p>
                </li>
              ))}
          </ul>
        </section>
      ))}
    </main>
  );
}
```

`src/app/(home)/staff/page.tsx`:

```tsx
import type { Metadata } from "next";
import { listStaff } from "@/services/homeContentService";

export const metadata: Metadata = { title: "스태프" };
export const dynamic = "force-dynamic";

export default async function StaffPage() {
  const staff = await listStaff(true);

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-bold">나라카의 요괴들</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {staff.map((s) => (
          <div
            key={s.id}
            className="overflow-hidden rounded-lg border border-[var(--home-line)] bg-[var(--home-surface)]"
          >
            {s.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- Supabase Storage 공개 URL
              <img
                src={s.photoUrl}
                alt={s.name}
                className="aspect-square w-full object-cover"
              />
            ) : (
              <div className="flex aspect-square w-full items-center justify-center bg-[var(--home-line)] text-sm text-[var(--home-muted)]">
                사진 준비 중
              </div>
            )}
            <div className="p-4">
              <p className="font-semibold">{s.name}</p>
              {s.role && (
                <p className="text-xs text-[var(--home-burgundy)]">{s.role}</p>
              )}
              <p className="mt-2 text-sm text-[var(--home-muted)]">{s.intro}</p>
            </div>
          </div>
        ))}
        {staff.length === 0 && (
          <p className="text-sm text-[var(--home-muted)]">
            스태프 소개를 준비 중입니다.
          </p>
        )}
      </div>
    </main>
  );
}
```

- [ ] **Step 4: 공지·이벤트 목록/상세 4종**

`src/app/(home)/notice/page.tsx`:

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { listPosts } from "@/services/homeContentService";

export const metadata: Metadata = { title: "공지사항" };
export const dynamic = "force-dynamic";

export default async function NoticePage() {
  const posts = await listPosts({ type: "notice" });

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-bold">공지사항</h1>
      <ul className="mt-6 divide-y divide-[var(--home-line)]">
        {posts.map((p) => (
          <li key={p.id}>
            <Link href={`/notice/${p.id}`} className="flex items-baseline gap-2 py-3">
              <span className="truncate font-medium">
                {p.pinned ? "[고정] " : ""}
                {p.title}
              </span>
              <span className="ml-auto shrink-0 text-xs text-[var(--home-muted)]">
                {p.publishedAt.slice(0, 10)}
              </span>
            </Link>
          </li>
        ))}
        {posts.length === 0 && (
          <li className="py-6 text-sm text-[var(--home-muted)]">
            등록된 공지가 없습니다.
          </li>
        )}
      </ul>
    </main>
  );
}
```

`src/app/(home)/notice/[id]/page.tsx`:

```tsx
import { notFound } from "next/navigation";
import { PostBody } from "@/components/home/PostBody";
import { getPost } from "@/services/homeContentService";

export const dynamic = "force-dynamic";

export default async function NoticeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const post = await getPost(Number(id));
  if (!post || post.type !== "notice") notFound();

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <p className="text-xs text-[var(--home-muted)]">{post.publishedAt.slice(0, 10)}</p>
      <h1 className="mt-1 text-2xl font-bold">{post.title}</h1>
      {post.coverImageUrl && (
        // eslint-disable-next-line @next/next/no-img-element -- Supabase Storage 공개 URL
        <img
          src={post.coverImageUrl}
          alt=""
          className="mt-4 w-full rounded-lg object-cover"
        />
      )}
      <PostBody markdown={post.bodyMd} />
    </main>
  );
}
```

`src/app/(home)/events/page.tsx` — 나라카증권 고정 카드(코드 정의) + DB 이벤트:

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { listPosts } from "@/services/homeContentService";

export const metadata: Metadata = { title: "이벤트" };
export const dynamic = "force-dynamic";

export default async function EventsPage() {
  const posts = await listPosts({ type: "event" });

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-bold">이벤트</h1>

      {/* 나라카증권 상설 카드 — /event 주식앱 진입점 */}
      <Link
        href="/event"
        className="mt-6 block rounded-lg border-2 border-[var(--home-burgundy)] bg-[var(--home-surface)] p-5"
      >
        <p className="text-xs font-semibold text-[var(--home-burgundy)]">상설</p>
        <p className="mt-1 text-lg font-bold">나라카증권 — 모의 주식 거래</p>
        <p className="mt-1 text-sm text-[var(--home-muted)]">
          가상 화폐로 요괴 도시의 주식을 거래해보세요. 매장 방문 코드로 참여할 수
          있습니다.
        </p>
      </Link>

      <ul className="mt-6 flex flex-col gap-3">
        {posts.map((p) => (
          <li key={p.id}>
            <Link
              href={`/events/${p.id}`}
              className="block rounded-lg border border-[var(--home-line)] bg-[var(--home-surface)] p-4"
            >
              <p className="font-semibold">
                {p.pinned ? "[고정] " : ""}
                {p.title}
              </p>
              <p className="mt-1 text-xs text-[var(--home-muted)]">
                {p.eventStartDate}
                {p.eventEndDate ? ` ~ ${p.eventEndDate}` : ""}
              </p>
            </Link>
          </li>
        ))}
        {posts.length === 0 && (
          <li className="text-sm text-[var(--home-muted)]">
            진행 중인 이벤트가 없습니다.
          </li>
        )}
      </ul>
    </main>
  );
}
```

`src/app/(home)/events/[id]/page.tsx`:

```tsx
import { notFound } from "next/navigation";
import { PostBody } from "@/components/home/PostBody";
import { getPost } from "@/services/homeContentService";

export const dynamic = "force-dynamic";

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const post = await getPost(Number(id));
  if (!post || post.type !== "event") notFound();

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <p className="text-xs text-[var(--home-burgundy)]">
        {post.eventStartDate}
        {post.eventEndDate ? ` ~ ${post.eventEndDate}` : ""}
      </p>
      <h1 className="mt-1 text-2xl font-bold">{post.title}</h1>
      {post.coverImageUrl && (
        // eslint-disable-next-line @next/next/no-img-element -- Supabase Storage 공개 URL
        <img
          src={post.coverImageUrl}
          alt=""
          className="mt-4 w-full rounded-lg object-cover"
        />
      )}
      <PostBody markdown={post.bodyMd} />
    </main>
  );
}
```

- [ ] **Step 5: 빌드·스모크·커밋**

```bash
cd /Users/jefflee/workspace/naraka-home-wt && npm run build && npx eslint src
( npm run dev & pid=$!; ( sleep 50; kill -9 $pid 2>/dev/null ) & wd=$!; \
  sleep 12; for p in about location menu staff notice events games; do \
    echo "$p: $(curl -s -o /dev/null -w '%{http_code}' localhost:3000/$p)"; done; \
  kill $pid 2>/dev/null; kill $wd 2>/dev/null ); pkill -f "next dev" 2>/dev/null; true
git add "src/app/(home)" src/components/home/PostBody.tsx package.json package-lock.json
git commit -m "feat: 카페 서브페이지 7종 (소개·오시는길·메뉴·스태프·공지·이벤트·게임 허브)"
```
Expected: 7개 전부 200

---

### Task 11: 스크럽 여정 히어로 (인트로형 4장면)

**Files:**
- Create: `src/components/home/journey/ScrubJourney.tsx`, `public/journey/manifest.json`, `public/journey/placeholder/scene1.svg` ~ `scene4.svg`, `docs/JOURNEY-ASSETS.md`
- Modify: `src/app/(home)/page.tsx` (히어로 교체)

**Interfaces:**
- Consumes: `public/journey/manifest.json` (fetch)
- Produces: 매니페스트 스키마 (에셋 교체 시 이 계약만 지키면 코드 수정 불필요):

```json
{
  "mode": "stills" | "frames",
  "scenes": [{ "id": "desk", "label": "마녀의 책상", "image": "/journey/placeholder/scene1.svg" }],
  "frames": { "basePath": "/journey/desktop", "pattern": "s_%04d.webp", "count": 0, "mobileBasePath": "/journey/mobile", "mobileCount": 0 }
}
```

- [ ] **Step 1: 플레이스홀더 장면 4종 + 매니페스트**

```bash
cd /Users/jefflee/workspace/naraka-home-wt && mkdir -p public/journey/placeholder
i=1
for scene in "마녀의 책상|#2b1d1a|#7c2231" "액자 속으로|#3a2430|#b97f2e" "카페 홀|#4a1f28|#e8d9b8" "게시판 앞|#241a20|#9c6b30"; do
  IFS='|' read -r label bg fg <<< "$scene"
  cat > "public/journey/placeholder/scene$i.svg" << EOF
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900">
  <rect width="1600" height="900" fill="$bg"/>
  <rect x="60" y="60" width="1480" height="780" fill="none" stroke="$fg" stroke-width="6"/>
  <text x="800" y="470" text-anchor="middle" font-size="72" fill="$fg" font-family="sans-serif">$label</text>
  <text x="800" y="540" text-anchor="middle" font-size="28" fill="$fg" opacity="0.7" font-family="sans-serif">장면 $i / 4 — 에셋 교체 예정</text>
</svg>
EOF
  i=$((i+1))
done
```

`public/journey/manifest.json`:

```json
{
  "mode": "stills",
  "scenes": [
    { "id": "desk", "label": "마녀의 책상", "image": "/journey/placeholder/scene1.svg" },
    { "id": "frame", "label": "액자 속으로", "image": "/journey/placeholder/scene2.svg" },
    { "id": "hall", "label": "카페 홀", "image": "/journey/placeholder/scene3.svg" },
    { "id": "board", "label": "게시판 앞", "image": "/journey/placeholder/scene4.svg" }
  ],
  "frames": {
    "basePath": "/journey/desktop",
    "pattern": "s_%04d.webp",
    "count": 0,
    "mobileBasePath": "/journey/mobile",
    "mobileCount": 0
  }
}
```

- [ ] **Step 2: 스크럽 엔진 컴포넌트**

`src/components/home/journey/ScrubJourney.tsx`:

```tsx
"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

interface JourneyScene {
  id: string;
  label: string;
  image: string;
}

interface JourneyManifest {
  mode: "stills" | "frames";
  scenes: JourneyScene[];
  frames: {
    basePath: string;
    pattern: string;
    count: number;
    mobileBasePath: string;
    mobileCount: number;
  };
}

const SEEN_KEY = "naraka-journey-seen";

function frameUrl(base: string, pattern: string, index: number): string {
  return `${base}/${pattern.replace("%04d", String(index + 1).padStart(4, "0"))}`;
}

// 스크롤 스크럽 여정 히어로 (인트로형 4장면 — scroll-world 방식 자체 구현)
// - stills 모드: 장면 정지 이미지를 진행도에 따라 크로스페이드 (에셋 도착 전 기본)
// - frames 모드: WebP 프레임 시퀀스를 canvas에 스크럽 (실제 비행 클립 추출본)
// - 안전장치: 건너뛰기 앵커 / prefers-reduced-motion 정적 폴백 / 재방문 축약
export function ScrubJourney() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const framesRef = useRef<(HTMLImageElement | null)[]>([]);
  const [manifest, setManifest] = useState<JourneyManifest | null>(null);
  const [progress, setProgress] = useState(0);
  const [collapsed, setCollapsed] = useState(false);
  const [reduced, setReduced] = useState(false);

  // 초기화: 매니페스트 로드 + 재방문·모션 축소 판정
  useEffect(() => {
    try {
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
      if (mq.matches) setReduced(true);
    } catch {
      // matchMedia 미지원 환경은 풀 여정 유지
    }
    try {
      if (window.localStorage.getItem(SEEN_KEY) === "1") setCollapsed(true);
      else window.localStorage.setItem(SEEN_KEY, "1");
    } catch {
      // 저장 불가(시크릿 모드 등)면 항상 풀 여정
    }
    void fetch("/journey/manifest.json")
      .then((r) => (r.ok ? (r.json() as Promise<JourneyManifest>) : null))
      .then((m) => setManifest(m))
      .catch(() => setManifest(null));
  }, []);

  // frames 모드: 프레임 지연 로드
  useEffect(() => {
    if (!manifest || manifest.mode !== "frames" || manifest.frames.count === 0) return;
    framesRef.current = new Array<HTMLImageElement | null>(
      manifest.frames.count
    ).fill(null);
    for (let i = 0; i < manifest.frames.count; i += 1) {
      const img = new Image();
      img.src = frameUrl(manifest.frames.basePath, manifest.frames.pattern, i);
      img.onload = () => {
        framesRef.current[i] = img;
      };
    }
  }, [manifest]);

  // 스크롤 → 진행도 (rAF 스로틀)
  useEffect(() => {
    if (collapsed || reduced) return;
    let raf = 0;
    function onScroll() {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const el = wrapRef.current;
        if (!el) return;
        const total = el.offsetHeight - window.innerHeight;
        if (total <= 0) return;
        const scrolled = Math.min(Math.max(-el.getBoundingClientRect().top, 0), total);
        setProgress(scrolled / total);
      });
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [collapsed, reduced]);

  // frames 모드: 진행도에 해당하는 프레임을 canvas에 그린다
  useEffect(() => {
    if (!manifest || manifest.mode !== "frames") return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const idx = Math.min(
      manifest.frames.count - 1,
      Math.floor(progress * manifest.frames.count)
    );
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
  }, [progress, manifest]);

  if (!manifest || manifest.scenes.length === 0) return null;

  const scenes = manifest.scenes;

  // 정적 폴백 (모션 축소) 또는 재방문 축약 히어로
  if (reduced || collapsed) {
    return (
      <section className="relative">
        {/* eslint-disable-next-line @next/next/no-img-element -- 여정 에셋 */}
        <img
          src={scenes[0].image}
          alt={scenes[0].label}
          className="h-[60vh] w-full object-cover"
        />
        <div className="absolute inset-x-0 bottom-6 flex justify-center gap-3">
          {collapsed && !reduced && (
            <button
              type="button"
              className="rounded-md bg-[var(--home-surface)]/90 px-4 py-2 text-sm"
              onClick={() => {
                setCollapsed(false);
                try {
                  window.localStorage.removeItem(SEEN_KEY);
                } catch {
                  // 무시 — 저장 불가 환경
                }
              }}
            >
              여정 다시 보기
            </button>
          )}
          <Link
            href="#calendar"
            className="rounded-md bg-[var(--home-burgundy)] px-4 py-2 text-sm text-[var(--home-surface)]"
          >
            달력·출근표 보기
          </Link>
        </div>
      </section>
    );
  }

  // 풀 여정: 장면당 120vh 스크롤 구간, sticky 뷰포트에 크로스페이드/프레임 스크럽
  const sceneFloat = progress * (scenes.length - 1);
  const current = Math.min(scenes.length - 1, Math.floor(sceneFloat));
  const blend = sceneFloat - current;

  return (
    <div ref={wrapRef} style={{ height: `${scenes.length * 120}vh` }}>
      <div className="sticky top-0 h-dvh overflow-hidden">
        {manifest.mode === "frames" && manifest.frames.count > 0 ? (
          <canvas ref={canvasRef} className="size-full object-cover" />
        ) : (
          scenes.map((scene, i) => (
            // eslint-disable-next-line @next/next/no-img-element -- 여정 에셋
            <img
              key={scene.id}
              src={scene.image}
              alt={scene.label}
              className="absolute inset-0 size-full object-cover transition-opacity duration-300"
              style={{
                opacity: i === current ? 1 - blend : i === current + 1 ? blend : 0,
              }}
            />
          ))
        )}
        <button
          type="button"
          className="absolute right-4 top-4 rounded-md bg-[var(--home-surface)]/90 px-3 py-1.5 text-sm"
          onClick={() =>
            document.getElementById("calendar")?.scrollIntoView({ behavior: "smooth" })
          }
        >
          건너뛰기
        </button>
        <p className="absolute inset-x-0 bottom-4 text-center text-xs text-[var(--home-surface)]/80">
          스크롤해서 나라카로 들어가기
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: 홈에 여정 히어로 배치**

`src/app/(home)/page.tsx`의 임시 히어로 섹션(`{/* Task 11에서 ... */}` 주석 블록)을 다음으로 교체하고 임포트 추가:

```tsx
import { ScrubJourney } from "@/components/home/journey/ScrubJourney";
```

```tsx
      <ScrubJourney />
      <section className="mx-auto max-w-3xl px-4 pt-12 text-center">
        <h1 className="text-3xl font-bold tracking-widest">{HOME_INFO.name}</h1>
        <p className="mt-2 text-[var(--home-muted)]">{HOME_INFO.tagline}</p>
      </section>
```

- [ ] **Step 4: 에셋 교체 가이드 문서**

`docs/JOURNEY-ASSETS.md`:

```markdown
# 스크럽 여정 에셋 교체 가이드

## 제작 파이프라인 (분담)
1. 장면 이미지 4장 — 사장님이 Gemini/Midjourney로 생성 (앤틱 레트로 원화 4장을 스타일 레퍼런스로).
   장면: 마녀의 책상(명패·이력서·도장) → 단체사진 액자 다이브 → 카페 홀 → 게시판.
   원칙: 앞 장면의 "끝 프레임"과 다음 장면의 "시작 프레임"이 같은 구도여야 이음새가 자연스럽다.
2. 비행(dive-in) 클립 — 힉스필드 image-to-video. 장면당 3~5초, 카메라가 전진(dolly-in)하는 모션.
3. 프레임 추출 — 클립들을 순서대로 이어붙인 뒤 WebP 프레임 시퀀스로:

    # 클립 연결 (같은 해상도·fps 전제)
    ffmpeg -f concat -safe 0 -i clips.txt -c copy journey.mp4
    # 데스크톱 16:9 프레임 추출 (24fps, 1600px 폭)
    mkdir -p public/journey/desktop
    ffmpeg -i journey.mp4 -vf "fps=24,scale=1600:-2" -c:v libwebp -quality 78 public/journey/desktop/s_%04d.webp
    # 모바일 9:16 체인도 동일하게 public/journey/mobile 에

4. `public/journey/manifest.json` 갱신:
   - `"mode": "frames"`, `frames.count` = 추출된 프레임 수
   - scenes 배열의 image도 실제 장면 스틸로 교체 (정적 폴백·재방문 히어로에 사용)

## 용량 예산
- 프레임 수 = 클립 총 길이 × 24fps. 4장면 × 4초면 약 384프레임.
- WebP quality 78, 1600px 기준 프레임당 약 40~80KB → 총 15~30MB는 과하므로
  **fps=12로 낮추거나 quality 70으로 조정해 총 10MB 이하**를 목표로 한다.
  스크럽은 재생이 아니라 탐색이라 12fps도 충분히 부드럽다.
- 프레임은 지연 로드되며 첫 화면은 scenes[0].image가 즉시 보인다.

## 연결 실패 시 폴백
장면 간 프레임이 어긋나면 클립 경계에 0.3초 크로스 디졸브를 넣어 다시 추출:
    ffmpeg -i a.mp4 -i b.mp4 -filter_complex "xfade=transition=fade:duration=0.3:offset=3.7" ab.mp4
```

- [ ] **Step 5: 빌드·검증·커밋**

```bash
cd /Users/jefflee/workspace/naraka-home-wt && npm run build && npx eslint src
( npm run dev & pid=$!; ( sleep 40; kill -9 $pid 2>/dev/null ) & wd=$!; \
  sleep 12; \
  echo "manifest: $(curl -s -o /dev/null -w '%{http_code}' localhost:3000/journey/manifest.json)"; \
  curl -s localhost:3000/ | grep -o "건너뛰기\|스크롤해서 나라카로" | sort -u; \
  kill $pid 2>/dev/null; kill $wd 2>/dev/null ); pkill -f "next dev" 2>/dev/null; true
git add public/journey src/components/home/journey "src/app/(home)/page.tsx" docs/JOURNEY-ASSETS.md
git commit -m "feat: 스크롤 스크럽 여정 히어로 (4장면 인트로·건너뛰기·재방문 축약·모션 축소 폴백)"
```
Expected: manifest 200. (`건너뛰기` 텍스트는 클라이언트 렌더라 SSR HTML에 없을 수 있음 — 없으면 Task 12 verify에서 브라우저로 확인)

---

### Task 12: 통합 검증 · 레포 리네임 · PR

**Files:** 없음 (검증·인프라)

- [ ] **Step 1: 전체 게이트**

```bash
cd /Users/jefflee/workspace/naraka-home-wt && npm run build && npx eslint src && npx vitest run && npx supabase db reset 2>&1 | tail -2
```
Expected: 전부 통과

- [ ] **Step 2: 실앱 검증 (verify 스킬)**

`/verify` 스킬(프로젝트 스킬: dev 서버 + agent-browser 레시피)로 확인 — Task 9의 시드 데이터를 다시 넣은 뒤:
1. `/` — 여정 히어로 표시 → 스크롤로 장면 전환 → 건너뛰기 클릭 시 달력 앵커 이동
2. 달력에서 8/24 클릭 → 이벤트 링크·출근 요괴 시간대 표시
3. 7탭 페이지 전부 렌더 (about/location/menu/staff/notice/events/games)
4. `/events`의 나라카증권 카드 → `/event` 진입, 주식앱 정상 (BottomNav 4탭 이동 포함)
5. 구 URL `/portfolio` → `/event/portfolio` 리다이렉트
6. 어드민 로그인 → 홈페이지 탭에서 공지 작성·메뉴 등록·출근표 저장 → 공개 페이지 반영
7. 재방문 시 여정 축약 + "여정 다시 보기" 동작

- [ ] **Step 3: 레포 리네임 (사장님 승인 완료 사항)**

```bash
gh repo rename naraka-home --repo JeffKM/naraka-stock --yes
cd /Users/jefflee/workspace/naraka-stock && git remote set-url origin "$(git remote get-url origin | sed 's/naraka-stock/naraka-home/')" && git remote -v
cd /Users/jefflee/workspace/naraka-home-wt && git remote -v
```
Expected: 두 워크트리 모두 remote가 `naraka-home`. Vercel 연결은 GitHub 리네임을 자동 추적하지만, 대시보드에서 프로젝트 연결 상태 1회 확인 (배포 로그에 리포 경로).

- [ ] **Step 4: 푸시 + 드래프트 PR**

```bash
cd /Users/jefflee/workspace/naraka-home-wt && git push -u origin feat/naraka-home
gh pr create --draft --title "feat: 나라카 공식 홈페이지 + 주식앱 /event 편입" --body "$(cat <<'EOF'
## 요약
- 카페 공식 홈페이지 신설: 스크럽 여정 히어로, 이벤트 달력+요괴 출근표, 서브페이지 7종
- 주식앱 전체를 /event 하위로 편입 (API /api/* 불변 — pg_cron 무영향), 구 URL 리다이렉트
- 어드민 콘솔에 홈페이지 관리 탭 (공지·이벤트/출근표/스태프/메뉴 + 이미지 업로드)
- 마이그레이션 1종(20260824000000_home_content) + Storage 활성화

## 머지 조건
- **8/31 이후에만 머지** (8/30 이벤트 종료 전 프로덕션 무변경)
- 머지 전: prod 마이그레이션 push + Storage 버킷 확인
- 머지 후: 배치 1회 정상 동작 확인 (/api/cron/daily-batch)

스펙: docs/superpowers/specs/2026-08-24-naraka-home-design.md

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```
Expected: 드래프트 PR 생성. **머지는 하지 않는다.**

---

## 계획 밖 후속 (참고)

- 실제 여정 에셋 도착 시: `docs/JOURNEY-ASSETS.md` 절차로 교체 (코드 수정 불필요)
- 8/31 전환일: PR 머지 → prod `supabase db push` → Vercel 배포 → 배치·리다이렉트 확인 (`docs/DEPLOY.md` 절차 준수)
- 스태프 실사진·상세 주소·예약 링크: `HOME_INFO`·어드민에서 교체
- 여정 투어형 증축(장면 추가+탭 CTA), 홈 전용 OG 이미지, 지도 임베드는 별도 작업
- 모바일 9:16 프레임 체인: 매니페스트 스키마(`mobileBasePath`·`mobileCount`)는 예약돼 있으나 엔진 1차 구현은 데스크톱 프레임만 사용 — 실제 에셋 도착 시 뷰포트 분기 추가
- 출근표 아바타의 치비 일러스트 교체(현재는 실사/이니셜): 치비 에셋 준비 시 `home_staff.photo_url`과 별도 필드 추가 검토
