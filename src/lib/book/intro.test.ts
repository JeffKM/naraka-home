import { describe, expect, it } from "vitest";
import { introMode, isHomeRoot } from "./intro";

const base = { pathname: "/", search: "", visited: false as boolean | null, reducedMotion: false };

describe("introMode", () => {
  it("첫 방문 + 홈 첫 쪽 = 전체 인트로", () => {
    expect(introMode(base)).toBe("full");
  });
  it("같은 세션 재진입 = 짧게", () => {
    expect(introMode({ ...base, visited: true })).toBe("short");
  });
  it("저장소 막힘(null)은 재진입 취급", () => {
    expect(introMode({ ...base, visited: null })).toBe("short");
  });
  it("딥링크는 인트로 없음", () => {
    expect(introMode({ ...base, pathname: "/events/3" })).toBe("none");
  });
  it("홈의 다른 쪽(?p=)도 딥링크", () => {
    expect(introMode({ ...base, search: "p=calendar" })).toBe("none");
  });
  it("움직임 줄이기 = 없음", () => {
    expect(introMode({ ...base, reducedMotion: true })).toBe("none");
  });
});

describe("isHomeRoot", () => {
  it("month 쿼리만 있으면 홈 첫 쪽", () => {
    expect(isHomeRoot("/", "month=2026-10")).toBe(true);
  });
  it("p 쿼리가 있으면 아님", () => {
    expect(isHomeRoot("/", "?p=news")).toBe(false);
  });
});
