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
