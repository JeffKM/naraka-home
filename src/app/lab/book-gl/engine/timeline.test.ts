import { describe, expect, it } from "vitest";
import { TL, closingPose, deskness, handPhase, openingPose, toPlace } from "./timeline";

const PI = Math.PI;
const steps = (fn: (t: number) => void) => {
  for (let t = 0; t <= TL.end; t += 1) fn(t);
};

describe("책 교체 타임라인", () => {
  it("덮는 책은 펼침에서 시작해 닫힘으로 끝난다", () => {
    const a = closingPose(0);
    expect(a.cover).toBeCloseTo(PI);
    expect(a.bundle).toBeCloseTo(PI);
    expect(a.gutter).toBeCloseTo(1);
    const b = closingPose(TL.closeBounce[1]);
    expect(b.cover).toBeCloseTo(0);
    expect(b.bundle).toBeCloseTo(0);
    expect(b.gutter).toBeCloseTo(0);
  });

  it("펼치는 책은 닫힘에서 시작해 펼침으로 끝나고, 낱장은 모두 묶음에 붙는다", () => {
    const a = openingPose(TL.lift[0]);
    expect(a.cover).toBeCloseTo(0);
    const b = openingPose(TL.end);
    expect(b.cover).toBeCloseTo(PI);
    expect(b.bundle).toBeCloseTo(PI);
    expect(b.gutter).toBeCloseTo(1);
    b.sheets.forEach((s) => expect(s.angle).toBeCloseTo(b.bundle));
  });

  it("각도가 한 프레임(1ms)에 튀지 않는다", () => {
    let prev = closingPose(0);
    let prevOpen = openingPose(TL.lift[0]);
    steps((t) => {
      const c = closingPose(t);
      expect(Math.abs(c.cover - prev.cover)).toBeLessThan(0.05);
      expect(Math.abs(c.bundle - prev.bundle)).toBeLessThan(0.05);
      prev = c;
      if (t < TL.lift[0]) return;
      const o = openingPose(t);
      expect(Math.abs(o.cover - prevOpen.cover)).toBeLessThan(0.05);
      expect(Math.abs(o.bundle - prevOpen.bundle)).toBeLessThan(0.05);
      prevOpen = o;
    });
  });

  it("펼칠 때 묶음은 표지를, 낱장은 묶음을 앞지르지 않는다 (서로 뚫지 않음)", () => {
    steps((t) => {
      if (t < TL.lift[0]) return;
      const o = openingPose(t);
      expect(o.bundle).toBeLessThanOrEqual(o.cover + 1e-9);
      o.sheets.forEach((s) => expect(s.angle).toBeLessThanOrEqual(o.bundle + 1e-9));
    });
  });

  it("덮을 때 묶음이 표지보다 먼저 떨어지고 0 아래로 가지 않는다", () => {
    steps((t) => {
      const c = closingPose(t);
      expect(c.bundle).toBeLessThanOrEqual(c.cover + 1e-9);
      expect(c.bundle).toBeGreaterThanOrEqual(0);
    });
  });

  it("카메라는 펼친 책 위에서 시작해 책상 전경을 거쳐 돌아온다", () => {
    expect(deskness(0)).toBeCloseTo(0);
    expect(deskness(TL.slide[1])).toBeCloseTo(1);
    expect(deskness(TL.end)).toBeCloseTo(0);
  });

  it("새 책은 책상 가운데에 멈추고, 손은 끝나기 전에 사라진다", () => {
    expect(toPlace(TL.end).x).toBeCloseTo(0);
    expect(toPlace(TL.end).yaw).toBeCloseTo(0);
    expect(handPhase(TL.slide[0] - 1).phase).toBe("hidden");
    expect(handPhase(TL.lift[0] + 1).phase).toBe("lift");
    expect(handPhase(TL.end).phase).toBe("hidden");
  });
});
