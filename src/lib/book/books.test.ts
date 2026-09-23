import { describe, expect, it } from "vitest";
import { BOOKS, bookOf, getBook } from "./books";

describe("bookOf", () => {
  it("루트는 홈 책", () => {
    expect(bookOf("/")).toBe("home");
  });
  it("첫 세그먼트로 책을 고른다", () => {
    expect(bookOf("/notice/12")).toBe("notice");
    expect(bookOf("/events")).toBe("events");
    expect(bookOf("/staff/3")).toBe("staff");
  });
  it("주식앱·어드민은 책 밖", () => {
    expect(bookOf("/event")).toBeNull();
    expect(bookOf("/event/trade")).toBeNull();
    expect(bookOf("/admin")).toBeNull();
  });
});

describe("BOOKS", () => {
  it("8권, 서랍 순서 고정", () => {
    expect(BOOKS.map((b) => b.id)).toEqual([
      "home", "about", "location", "menu", "staff", "notice", "events", "games",
    ]);
  });
  it("getBook은 루트 경로를 준다", () => {
    expect(getBook("games").root).toBe("/games");
  });
});
