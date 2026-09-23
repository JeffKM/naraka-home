import { describe, expect, it } from "vitest";
import { pageKeyOf, pageKeyOfHref } from "./pageKey";

describe("pageKeyOf", () => {
  it("쪽을 가르는 쿼리만 남긴다", () => {
    expect(pageKeyOf("/", "p=calendar&month=2026-09")).toBe("/?p=calendar");
  });
  it("쿼리가 없으면 경로만", () => {
    expect(pageKeyOf("/notice", "")).toBe("/notice");
  });
  it("물음표로 시작해도 같다", () => {
    expect(pageKeyOf("/notice", "?page=2")).toBe("/notice?page=2");
  });
  it("끝 슬래시를 지운다", () => {
    expect(pageKeyOf("/staff/", "")).toBe("/staff");
  });
  it("순서를 p·c·page로 고정", () => {
    expect(pageKeyOf("/x", "page=2&p=1")).toBe("/x?p=1&page=2");
  });
  it("한글 분류는 href 키와 URL 키가 같다", () => {
    const href = `/menu?c=${encodeURIComponent("차 & 음료")}`;
    expect(pageKeyOfHref(href)).toBe(
      pageKeyOf("/menu", new URLSearchParams({ c: "차 & 음료" }))
    );
  });
});
