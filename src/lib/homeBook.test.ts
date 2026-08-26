import { describe, expect, it } from "vitest";
import {
  BOOK_PAGES,
  BOOK_ROOMS,
  findRoom,
  layerOpen,
  roomsOfPage,
} from "./homeBook";

describe("homeBook 데이터", () => {
  it("면은 3개이고 막 순서대로다", () => {
    expect(BOOK_PAGES.map((p) => p.id)).toEqual(["p1", "p2", "p3"]);
    expect(BOOK_PAGES.map((p) => p.jailTally)).toEqual([5, 10, 15]);
  });

  it("공간 8곳이 전부 존재하는 면을 가리킨다", () => {
    expect(BOOK_ROOMS).toHaveLength(8);
    const pageIds = new Set(BOOK_PAGES.map((p) => p.id));
    for (const r of BOOK_ROOMS) expect(pageIds.has(r.pageId)).toBe(true);
  });

  it("면별 공간 수는 2·2·4다", () => {
    expect(roomsOfPage("p1").map((r) => r.id)).toEqual(["office", "vault"]);
    expect(roomsOfPage("p2").map((r) => r.id)).toEqual(["street", "house"]);
    expect(roomsOfPage("p3").map((r) => r.id)).toEqual(["field", "jail", "cafe", "plaza"]);
  });

  it("방마다 겹이 5개 이상이고 z가 앞으로 갈수록 커진다", () => {
    for (const r of BOOK_ROOMS) {
      expect(r.layers.length).toBeGreaterThanOrEqual(5);
      const zs = r.layers.map((l) => l.z);
      expect([...zs].sort((a, b) => a - b)).toEqual(zs);
    }
  });

  it("findRoom은 없는 id에 undefined", () => {
    expect(findRoom("office")?.label).toBe("사무소");
    expect(findRoom("nope")).toBeUndefined();
  });
});

describe("layerOpen — 판 등장 진행도", () => {
  const def = { open: 0.4, duration: 0.3 };
  it("등장 시점 전엔 0, 끝나면 1, 중간은 선형", () => {
    expect(layerOpen(def, 0)).toBe(0);
    expect(layerOpen(def, 0.4)).toBe(0);
    expect(layerOpen(def, 0.55)).toBeCloseTo(0.5);
    expect(layerOpen(def, 0.7)).toBe(1);
    expect(layerOpen(def, 1)).toBe(1);
  });
  it("범위 밖 입력은 0~1로 고정", () => {
    expect(layerOpen(def, -1)).toBe(0);
    expect(layerOpen(def, 2)).toBe(1);
  });
});
