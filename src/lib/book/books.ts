// 책 8권 정의 — 배열 순서 = 서랍 책등 순서
export type BookId =
  | "home" | "about" | "location" | "menu" | "staff" | "notice" | "events" | "games";

export interface BookDef {
  id: BookId;
  title: string; // 서랍·쪽 알림에 쓰는 책 이름
  root: string; // 책 첫 쪽 경로
}

export const BOOKS: readonly BookDef[] = [
  { id: "home", title: "나라카", root: "/" },
  { id: "about", title: "소개", root: "/about" },
  { id: "location", title: "오시는 길", root: "/location" },
  { id: "menu", title: "메뉴", root: "/menu" },
  { id: "staff", title: "요괴", root: "/staff" },
  { id: "notice", title: "공지", root: "/notice" },
  { id: "events", title: "이벤트", root: "/events" },
  { id: "games", title: "게임", root: "/games" },
];

const BY_SEGMENT: Record<string, BookId> = {
  about: "about",
  location: "location",
  menu: "menu",
  staff: "staff",
  notice: "notice",
  events: "events",
  games: "games",
};

// 경로 첫 세그먼트로 책을 판정한다. 주식앱(/event)·어드민 등 책 밖 경로는 null
export function bookOf(pathname: string): BookId | null {
  if (pathname === "/" || pathname === "") return "home";
  const segment = pathname.split("/")[1] ?? "";
  return BY_SEGMENT[segment] ?? null;
}

export function getBook(id: BookId): BookDef {
  const book = BOOKS.find((b) => b.id === id);
  if (!book) throw new Error(`알 수 없는 책: ${id}`);
  return book;
}
