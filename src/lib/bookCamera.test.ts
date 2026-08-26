import { describe, expect, it } from "vitest";
import { BOOK_ROOMS, PAGE_H, PAGE_W } from "./homeBook";
import { easeInOutCubic, pageCamera, pageOffsetX, roomCamera } from "./bookCamera";

describe("pageCamera", () => {
  it("면 0 정면: 면 중앙을 보고 z는 양수", () => {
    const c = pageCamera(0, false);
    expect(c.target).toEqual([0, PAGE_H / 2, 0]);
    expect(c.position[0]).toBe(0);
    expect(c.position[2]).toBeGreaterThan(0);
  });
  it("면 1은 x가 면 간격만큼 이동", () => {
    expect(pageCamera(1, false).target[0]).toBe(pageOffsetX(1));
    expect(pageOffsetX(1)).toBeGreaterThan(PAGE_W);
  });
  it("세로 화면은 더 가까이(z 작음)가 아니라 더 멀리(폭 맞춤)", () => {
    expect(pageCamera(0, true).position[2]).toBeGreaterThan(pageCamera(0, false).position[2]);
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
