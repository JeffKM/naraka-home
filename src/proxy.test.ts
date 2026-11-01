import { describe, expect, it } from "vitest";
import { isHomePath } from "./proxy";

describe("isHomePath (카페 홈 잠금 대상)", () => {
  it("카페 홈 주소는 잠금 대상", () => {
    for (const p of ["/", "/menu", "/staff/3", "/events", "/events/1", "/notice"]) {
      expect(isHomePath(p)).toBe(true);
    }
  });
  it("나라카증권·콘솔·준비 중 화면은 잠그지 않는다", () => {
    for (const p of ["/event", "/event/login", "/event/portfolio", "/admin", "/coming-soon"]) {
      expect(isHomePath(p)).toBe(false);
    }
  });
});
