import { describe, expect, it } from "vitest";
import { BOOK_ROOMS, PAGE_H, PAGE_W } from "./homeBook";
import { easeInOutCubic, pageCamera, pageDistance, pageOffsetX, roomCamera } from "./bookCamera";

const LANDSCAPE = 1.6;
const PORTRAIT = 390 / 844;

describe("pageCamera", () => {
  it("면 0 정면: 면 중앙을 보고 z는 양수", () => {
    const c = pageCamera(0, LANDSCAPE);
    expect(c.target).toEqual([0, PAGE_H / 2, 0]);
    expect(c.position[0]).toBe(0);
    expect(c.position[2]).toBeGreaterThan(0);
  });
  it("면 1은 x가 면 간격만큼 이동", () => {
    expect(pageCamera(1, LANDSCAPE).target[0]).toBe(pageOffsetX(1));
    expect(pageOffsetX(1)).toBeGreaterThan(PAGE_W);
  });
  it("가로 화면은 최소 거리(19)로 고정 — 더 가까워지면 위아래 여백이 사라진다", () => {
    expect(pageCamera(0, LANDSCAPE).position[2]).toBe(19);
  });
  it("세로 화면(390×844)은 면 폭을 담도록 훨씬 멀어진다", () => {
    // FOV 40°·여백 12% 기준 계산값
    expect(pageCamera(0, PORTRAIT).position[2]).toBeCloseTo(53.3, 0);
  });
  it("세로 화면은 가로 화면보다 멀다(폭 맞춤)", () => {
    expect(pageCamera(0, PORTRAIT).position[2]).toBeGreaterThan(pageCamera(0, LANDSCAPE).position[2]);
  });
});

describe("pageDistance", () => {
  it("화면이 좁아질수록 거리가 멀어진다(단조)", () => {
    expect(pageDistance(0.5)).toBeGreaterThan(pageDistance(0.8));
    expect(pageDistance(0.8)).toBeGreaterThan(pageDistance(1.2));
  });
  it("비율이 0이나 음수로 들어와도 유한한 거리를 낸다", () => {
    expect(Number.isFinite(pageDistance(0))).toBe(true);
    expect(Number.isFinite(pageDistance(-1))).toBe(true);
  });
});

describe("roomCamera", () => {
  it("방 도착점은 면 오프셋을 더한 cameraIn이고, 타깃은 그 방 뒷벽 쪽", () => {
    const room = BOOK_ROOMS[2]; // street, p2
    const c = roomCamera(room, 1);
    expect(c.position[0]).toBeCloseTo(pageOffsetX(1) + room.cameraIn.x);
    expect(c.position[2]).toBeCloseTo(room.cameraIn.z);
    expect(c.target[2]).toBeLessThan(c.position[2]);
  });
});

describe("easeInOutCubic", () => {
  it("양 끝은 0·1, 중앙은 0.5", () => {
    expect(easeInOutCubic(0)).toBe(0);
    expect(easeInOutCubic(1)).toBe(1);
    expect(easeInOutCubic(0.5)).toBeCloseTo(0.5);
  });
});
