import { describe, expect, it } from "vitest";
import {
  buildMonthGrid,
  formatMinute,
  shiftMonth,
  type CalendarEventItem,
  type CalendarScheduleItem,
} from "./homeCalendar";

// 2026-08-01은 토요일 — 월요일 시작 그리드면 앞 채움 5일(7/27~31), 총 6주
describe("buildMonthGrid", () => {
  it("2026-08은 월요일 시작 6주 그리드", () => {
    const grid = buildMonthGrid("2026-08", "2026-08-24", [], []);
    expect(grid).toHaveLength(6);
    for (const week of grid) expect(week).toHaveLength(7);
    expect(grid[0][0].date).toBe("2026-07-27");
    expect(grid[0][0].inMonth).toBe(false);
    expect(grid[0][5].date).toBe("2026-08-01");
    expect(grid[0][5].inMonth).toBe(true);
    expect(grid[5][6].date).toBe("2026-09-06");
  });

  it("오늘 표시는 todayKst와 일치하는 칸에만", () => {
    const grid = buildMonthGrid("2026-08", "2026-08-24", [], []);
    const cells = grid.flat();
    const today = cells.filter((c) => c.isToday);
    expect(today).toHaveLength(1);
    expect(today[0].date).toBe("2026-08-24");
  });

  it("기간 이벤트는 범위 안 모든 날짜에 전개된다", () => {
    const events: CalendarEventItem[] = [
      { id: 1, title: "나라카증권", startDate: "2026-08-01", endDate: "2026-08-03" },
      { id: 2, title: "하루 이벤트", startDate: "2026-08-02", endDate: null },
    ];
    const grid = buildMonthGrid("2026-08", "2026-08-24", events, []);
    const byDate = new Map(grid.flat().map((c) => [c.date, c]));
    expect(byDate.get("2026-08-01")?.events.map((e) => e.id)).toEqual([1]);
    expect(byDate.get("2026-08-02")?.events.map((e) => e.id)).toEqual([1, 2]);
    expect(byDate.get("2026-08-03")?.events.map((e) => e.id)).toEqual([1]);
    expect(byDate.get("2026-08-04")?.events).toEqual([]);
  });

  it("출근 스태프는 날짜별 중복 제거·오름차순", () => {
    const schedule: CalendarScheduleItem[] = [
      { workDate: "2026-08-02", staffId: 3, startMin: 720, endMin: 1080 },
      { workDate: "2026-08-02", staffId: 1, startMin: 1080, endMin: 1440 },
      { workDate: "2026-08-02", staffId: 3, startMin: 1080, endMin: 1440 },
    ];
    const grid = buildMonthGrid("2026-08", "2026-08-24", [], schedule);
    const day = grid.flat().find((c) => c.date === "2026-08-02");
    expect(day?.staffIds).toEqual([1, 3]);
  });
});

describe("formatMinute", () => {
  it("분 → HH:MM", () => {
    expect(formatMinute(0)).toBe("00:00");
    expect(formatMinute(750)).toBe("12:30");
    expect(formatMinute(1440)).toBe("24:00");
  });
});

describe("shiftMonth", () => {
  it("연 경계 이동", () => {
    expect(shiftMonth("2026-08", 1)).toBe("2026-09");
    expect(shiftMonth("2026-01", -1)).toBe("2025-12");
    expect(shiftMonth("2026-12", 1)).toBe("2027-01");
  });
});
