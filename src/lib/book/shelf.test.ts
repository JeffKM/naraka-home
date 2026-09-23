import { describe, expect, it } from "vitest";
import { BOOKS } from "./books";
import { SHELF_SLOT_X, SPINE_FILL, rectCenter, shelfSlotRect, spineRect } from "./shelf";

describe("책장 칸", () => {
  it("책 수만큼 칸이 있다", () => {
    expect(SHELF_SLOT_X).toHaveLength(BOOKS.length);
  });

  it("칸은 왼쪽부터 겹치지 않고 이어진다", () => {
    for (let i = 1; i < SHELF_SLOT_X.length; i++) {
      expect(shelfSlotRect(i).left).toBeGreaterThan(
        shelfSlotRect(i - 1).left + shelfSlotRect(i - 1).width
      );
    }
  });

  it("칸은 그림 안(0~100%)에 있다", () => {
    for (let i = 0; i < SHELF_SLOT_X.length; i++) {
      const r = shelfSlotRect(i);
      expect(r.left).toBeGreaterThan(0);
      expect(r.left + r.width).toBeLessThan(100);
      expect(r.top).toBeGreaterThan(0);
      expect(r.top + r.height).toBeLessThan(100);
    }
  });

  it("없는 칸은 에러", () => {
    expect(() => shelfSlotRect(8)).toThrow();
  });
});

describe("책등 자리", () => {
  it("책등은 자기 칸 안에 들어가고 칸 바닥에 붙는다", () => {
    BOOKS.forEach((b, i) => {
      const slot = shelfSlotRect(i);
      const s = spineRect(b.id);
      expect(s.left).toBeGreaterThanOrEqual(slot.left - 0.01);
      expect(s.left + s.width).toBeLessThanOrEqual(slot.left + slot.width + 0.01);
      expect(s.top).toBeGreaterThanOrEqual(slot.top);
      expect(s.top + s.height).toBeCloseTo(slot.top + slot.height, 1);
    });
  });

  it("칸 위에 틈을 남긴다 (칸 높이의 SPINE_FILL 이하)", () => {
    BOOKS.forEach((b, i) => {
      expect(spineRect(b.id).height).toBeLessThanOrEqual(shelfSlotRect(i).height * SPINE_FILL + 0.01);
    });
  });

  it("책등 가운데는 칸 가운데와 가로로 같다", () => {
    BOOKS.forEach((b, i) => {
      expect(rectCenter(spineRect(b.id)).x).toBeCloseTo(rectCenter(shelfSlotRect(i)).x, 0);
    });
  });
});
