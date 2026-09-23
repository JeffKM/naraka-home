import "server-only";
import { buildMonthGrid, normalizeMonth, type CalendarDayCell } from "@/lib/homeCalendar";
import { getKstParts } from "@/lib/market";
import { getMonthEvents, listScheduleRange, listStaff } from "@/services/homeContentService";
import type { HomeScheduleEntry, HomeStaff } from "@/types/home";

export interface MonthCalendar {
  month: string;
  weeks: CalendarDayCell[][];
  staff: HomeStaff[];
  daySchedule: Record<string, HomeScheduleEntry[]>;
}

// 달력 쪽(홈 ?p=calendar, 이벤트 첫 쪽) 공용 데이터
export async function loadMonthCalendar(rawMonth: string | undefined): Promise<MonthCalendar> {
  const today = getKstParts().date;
  const month = normalizeMonth(rawMonth, today);
  const [y, m] = month.split("-").map(Number);
  const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const [events, schedule, staff] = await Promise.all([
    getMonthEvents(month),
    listScheduleRange(`${month}-01`, `${month}-${String(lastDay).padStart(2, "0")}`),
    listStaff(true),
  ]);
  const weeks = buildMonthGrid(
    month,
    today,
    events.map((e) => ({
      id: e.id,
      title: e.title,
      startDate: e.eventStartDate ?? today,
      endDate: e.eventEndDate,
    })),
    schedule
  );
  const daySchedule: Record<string, HomeScheduleEntry[]> = {};
  for (const entry of schedule) {
    (daySchedule[entry.workDate] ??= []).push(entry);
  }
  return { month, weeks, staff, daySchedule };
}
