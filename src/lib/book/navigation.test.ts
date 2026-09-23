import { describe, expect, it } from "vitest";
import { flipBackstopMs, neighborOf, planTransition, tabRefs, type BookPageRef } from "./navigation";

const M: BookPageRef[] = [
  "/notice", "/notice?page=2", "/notice/9", "/notice/8", "/notice/7", "/notice/6", "/notice/5",
].map((href, i) => ({ key: href, href, tab: `t${i}`, kind: i < 2 ? "list" : "detail" }));

describe("planTransition", () => {
  it("다른 책이면 교체", () => {
    expect(planTransition({ book: "notice", key: "/notice" }, M, { book: "events", key: "/events" }))
      .toEqual({ kind: "swap", from: "notice", to: "events" });
  });
  it("같은 쪽이면 없음", () => {
    expect(planTransition({ book: "notice", key: "/notice" }, M, { book: "notice", key: "/notice" }))
      .toEqual({ kind: "none" });
  });
  it("다음 쪽은 앞으로 한 장", () => {
    expect(planTransition({ book: "notice", key: "/notice" }, M, { book: "notice", key: "/notice?page=2" }))
      .toEqual({ kind: "flip", dir: 1, leaves: 0 });
  });
  it("이전 쪽은 뒤로 한 장", () => {
    expect(planTransition({ book: "notice", key: "/notice?page=2" }, M, { book: "notice", key: "/notice" }))
      .toEqual({ kind: "flip", dir: -1, leaves: 0 });
  });
  it("멀리 뛰면 후루룩 — 최소 3장", () => {
    expect(planTransition({ book: "notice", key: "/notice" }, M, { book: "notice", key: "/notice/9" }))
      .toEqual({ kind: "flip", dir: 1, leaves: 3 });
  });
  it("후루룩은 최대 5장", () => {
    expect(planTransition({ book: "notice", key: "/notice" }, M, { book: "notice", key: "/notice/5" }))
      .toEqual({ kind: "flip", dir: 1, leaves: 5 });
  });
  it("순서표에 없는 쪽은 앞으로 한 장", () => {
    expect(planTransition({ book: "notice", key: "/notice" }, M, { book: "notice", key: "/notice/99" }))
      .toEqual({ kind: "flip", dir: 1, leaves: 0 });
  });
});

describe("neighborOf", () => {
  it("다음·이전 쪽", () => {
    expect(neighborOf(M, "/notice", 1)?.key).toBe("/notice?page=2");
    expect(neighborOf(M, "/notice?page=2", -1)?.key).toBe("/notice");
  });
  it("책 끝·처음·모르는 쪽은 null", () => {
    expect(neighborOf(M, "/notice", -1)).toBeNull();
    expect(neighborOf(M, "/notice/5", 1)).toBeNull();
    expect(neighborOf(M, "/nope", 1)).toBeNull();
  });
});

describe("tabRefs", () => {
  it("8쪽 이하면 전부 탭", () => {
    expect(tabRefs(M.slice(0, 5))).toHaveLength(5);
  });
  it("8쪽이 넘으면 상세 쪽은 빼고", () => {
    const many: BookPageRef[] = [
      ...M,
      ...[4, 3, 2].map((n) => ({ key: `/notice/${n}`, href: `/notice/${n}`, tab: `${n}`, kind: "detail" as const })),
    ];
    expect(tabRefs(many).map((r) => r.key)).toEqual(["/notice", "/notice?page=2"]);
  });
});

describe("flipBackstopMs", () => {
  it("보통 넘김은 600ms + 여유", () => {
    expect(flipBackstopMs(0, false)).toBe(1000);
  });
  it("후루룩은 마지막 장 지연까지 더한다", () => {
    expect(flipBackstopMs(5, false)).toBe(5 * 70 + 450 + 400);
  });
  it("동작 줄이기는 페이드 시간 + 여유", () => {
    expect(flipBackstopMs(3, true)).toBe(550);
  });
});
