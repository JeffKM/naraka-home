import type { HomeMenuItem, HomePost, HomeStaff } from "@/types/home";
import { bookOf, getBook, type BookId } from "./books";
import { GAMES } from "./games";
import type { BookPageRef, PageKind } from "./navigation";
import { pageKeyOf, pageKeyOfHref } from "./pageKey";

// 책별 쪽 순서표 — 페이지가 이미 읽어 온 데이터로 만든다 (DB 이중 조회 없음)
export const LIST_PAGE_SIZE = 8;

function ref(href: string, tab: string, kind: PageKind): BookPageRef {
  return { key: pageKeyOfHref(href), href, tab, kind };
}

export const HOME_MANIFEST: readonly BookPageRef[] = [
  ref("/", "오늘", "content"),
  ref("/?p=calendar", "달력", "content"),
  ref("/?p=news", "새 소식", "content"),
  ref("/?p=visit", "방문", "content"),
];

export const ABOUT_MANIFEST: readonly BookPageRef[] = [
  ref("/about", "나라카란", "content"),
  ref("/about?p=1", "프롤로그", "content"),
  ref("/about?p=2", "1막 멜", "content"),
  ref("/about?p=3", "2막 바나", "content"),
  ref("/about?p=4", "3막 미호", "content"),
  ref("/about?p=5", "피날레", "content"),
];

export const LOCATION_MANIFEST: readonly BookPageRef[] = [
  ref("/location", "지도", "content"),
  ref("/location?p=hours", "영업시간", "content"),
  ref("/location?p=reserve", "예약", "content"),
];

export function listPageCount(n: number): number {
  return Math.max(1, Math.ceil(n / LIST_PAGE_SIZE));
}

export function clampPage(raw: string | undefined, total: number): number {
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 1) return 1;
  return Math.min(n, total);
}

// 0부터 센 글 순번 → 그 글이 실린 목록 쪽 번호(1부터)
export function listPageOf(index: number): number {
  return Math.floor(index / LIST_PAGE_SIZE) + 1;
}

export function noticeListHref(page: number): string {
  return page <= 1 ? "/notice" : `/notice?page=${page}`;
}

export function eventListHref(page: number): string {
  return `/events?page=${page}`;
}

export function buildMenuManifest(items: readonly HomeMenuItem[]): BookPageRef[] {
  const categories = [...new Set(items.map((i) => i.category))];
  return [
    ref("/menu", "목차", "toc"),
    ...categories.map((c) => ref(`/menu?c=${encodeURIComponent(c)}`, c, "content")),
  ];
}

export function buildStaffManifest(staff: readonly HomeStaff[]): BookPageRef[] {
  return [ref("/staff", "명단", "toc"), ...staff.map((s) => ref(`/staff/${s.id}`, s.name, "detail"))];
}

export function buildNoticeManifest(posts: readonly HomePost[]): BookPageRef[] {
  const lists = Array.from({ length: listPageCount(posts.length) }, (_, i) =>
    ref(noticeListHref(i + 1), `목록 ${i + 1}`, "list")
  );
  return [...lists, ...posts.map((p) => ref(`/notice/${p.id}`, p.title, "detail"))];
}

export type EventPhase = "ongoing" | "upcoming" | "past";

export function eventPhase(post: HomePost, today: string): EventPhase {
  const start = post.eventStartDate ?? post.publishedAt.slice(0, 10);
  const end = post.eventEndDate ?? start;
  if (end < today) return "past";
  if (start > today) return "upcoming";
  return "ongoing";
}

const PHASE_RANK: Record<EventPhase, number> = { ongoing: 0, upcoming: 1, past: 2 };

// 진행 중 → 예정(시작 가까운 순) → 지난(최근 시작 순)
export function orderEvents(posts: readonly HomePost[], today: string): HomePost[] {
  return [...posts].sort((a, b) => {
    const pa = eventPhase(a, today);
    const pb = eventPhase(b, today);
    if (pa !== pb) return PHASE_RANK[pa] - PHASE_RANK[pb];
    const sa = a.eventStartDate ?? a.publishedAt.slice(0, 10);
    const sb = b.eventStartDate ?? b.publishedAt.slice(0, 10);
    const asc = sa.localeCompare(sb);
    return pa === "past" ? -asc : asc;
  });
}

// ordered는 orderEvents 결과
export function buildEventManifest(ordered: readonly HomePost[]): BookPageRef[] {
  const lists = Array.from({ length: listPageCount(ordered.length) }, (_, i) =>
    ref(eventListHref(i + 1), `목록 ${i + 1}`, "list")
  );
  return [
    ref("/events", "달력", "content"),
    ...lists,
    ...ordered.map((p) => ref(`/events/${p.id}`, p.title, "detail")),
  ];
}

export function buildGamesManifest(): BookPageRef[] {
  return [ref("/games", "목차", "toc"), ...GAMES.map((g) => ref(`/games/${g.id}`, g.title, "detail"))];
}

// 쪽 데이터 오류 화면의 순서표 — 진짜 순서표는 못 읽었으니 "책 첫 쪽 + 이 쪽"만 둔다.
// 이걸 등록해야 발치 번호·탭·서랍의 "펼쳐 둔 책"이 직전 쪽(다른 책일 수도)에 머물지 않고, 휠이 엉뚱한 책으로 넘기지 않는다
export function buildErrorPage(
  pathname: string,
  search: string
): { book: BookId; key: string; manifest: BookPageRef[] } | null {
  const book = bookOf(pathname);
  if (!book) return null;
  const key = pageKeyOf(pathname, search);
  const query = search.startsWith("?") ? search.slice(1) : search;
  const self: BookPageRef = { key, href: query ? `${pathname}?${query}` : pathname, tab: "이 쪽", kind: "content" };
  const root = ref(getBook(book).root, "첫 쪽", "toc");
  return { book, key, manifest: root.key === key ? [self] : [root, self] };
}
