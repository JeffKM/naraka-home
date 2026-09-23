import { describe, expect, it } from "vitest";
import { decideSwipe, decideWheel, isNavPending, keyToDir, type ScrollBox, type WheelState } from "./input";

const box = (scrollTop: number, scrollHeight = 1000, clientHeight = 400): ScrollBox => ({
  scrollTop, scrollHeight, clientHeight,
});
const idle: WheelState = { armedDir: null, lastWheelAt: 0, lockedUntil: 0 };

describe("decideWheel", () => {
  it("넘치지 않는 쪽은 새 제스처에 바로 넘긴다", () => {
    expect(decideWheel(40, box(0, 400, 400), idle, 1000)).toEqual({ action: "flip", dir: 1 });
  });
  it("스크롤 칸이 없어도(데스크톱 왼쪽 면) 바로 넘긴다", () => {
    expect(decideWheel(-40, null, idle, 1000)).toEqual({ action: "flip", dir: -1 });
  });
  it("관성(250ms 이내 연속 이벤트)은 넘기지 않는다", () => {
    expect(decideWheel(40, null, { ...idle, lastWheelAt: 900 }, 1000)).toEqual({ action: "ignore" });
  });
  it("넘김 잠금 중엔 무시", () => {
    expect(decideWheel(40, null, { ...idle, lockedUntil: 1200 }, 1000)).toEqual({ action: "ignore" });
  });
  it("아주 작은 델타는 무시", () => {
    expect(decideWheel(2, null, idle, 1000)).toEqual({ action: "ignore" });
  });
  it("쪽 안에 남은 스크롤이 있으면 스크롤", () => {
    expect(decideWheel(40, box(100), idle, 1000)).toEqual({ action: "scroll" });
  });
  it("끝에 닿으면 먼저 장전", () => {
    expect(decideWheel(40, box(600), idle, 1000)).toEqual({ action: "arm", dir: 1 });
  });
  it("장전 뒤 새 제스처면 넘김", () => {
    expect(decideWheel(40, box(600), { ...idle, armedDir: 1, lastWheelAt: 500 }, 1000))
      .toEqual({ action: "flip", dir: 1 });
  });
  it("장전 뒤라도 관성이면 장전 유지", () => {
    expect(decideWheel(40, box(600), { ...idle, armedDir: 1, lastWheelAt: 900 }, 1000))
      .toEqual({ action: "arm", dir: 1 });
  });
  it("위쪽 끝에서 위로 굴리면 이전 쪽 장전", () => {
    expect(decideWheel(-40, box(0), idle, 1000)).toEqual({ action: "arm", dir: -1 });
  });
});

describe("decideSwipe", () => {
  it("위로 50px 이상 밀면 다음 쪽", () => {
    expect(decideSwipe({ y: 500, box: null }, 400)).toBe(1);
  });
  it("아래로 밀면 이전 쪽", () => {
    expect(decideSwipe({ y: 400, box: null }, 500)).toBe(-1);
  });
  it("짧은 스와이프는 무시", () => {
    expect(decideSwipe({ y: 500, box: null }, 470)).toBeNull();
  });
  it("쪽 안 스크롤이 남아 있으면 넘기지 않는다", () => {
    expect(decideSwipe({ y: 500, box: box(100) }, 300)).toBeNull();
  });
  it("시작할 때 이미 끝이었으면 넘긴다", () => {
    expect(decideSwipe({ y: 500, box: box(600) }, 300)).toBe(1);
    expect(decideSwipe({ y: 300, box: box(0) }, 500)).toBe(-1);
  });
});

describe("keyToDir", () => {
  it("→·PageDown은 다음, ←·PageUp은 이전", () => {
    expect(keyToDir("ArrowRight", "DIV", false)).toBe(1);
    expect(keyToDir("PageDown", "BODY", false)).toBe(1);
    expect(keyToDir("ArrowLeft", "DIV", false)).toBe(-1);
    expect(keyToDir("PageUp", "DIV", false)).toBe(-1);
  });
  it("입력 칸에서는 무시", () => {
    expect(keyToDir("ArrowRight", "INPUT", false)).toBeNull();
    expect(keyToDir("ArrowRight", "DIV", true)).toBeNull();
  });
  it("다른 키는 무시", () => {
    expect(keyToDir("Enter", "DIV", false)).toBeNull();
  });
});

describe("isNavPending", () => {
  const pending = { from: "/about", until: 9000 };
  it("요청한 쪽에 머물러 있고 시한 전이면 대기 중", () => {
    expect(isNavPending(pending, "/about", 1000)).toBe(true);
  });
  it("대기가 없으면 거짓", () => {
    expect(isNavPending(null, "/about", 1000)).toBe(false);
  });
  it("다른 쪽에 도착했으면 거짓", () => {
    expect(isNavPending(pending, "/about?p=1", 1000)).toBe(false);
  });
  it("안전 시한이 지나면 거짓", () => {
    expect(isNavPending(pending, "/about", 9000)).toBe(false);
  });
});
