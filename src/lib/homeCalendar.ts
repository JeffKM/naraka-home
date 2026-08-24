// 카페 홈 달력·출근표 순수 유틸 (타임존 이슈 방지를 위해 전부 UTC 산술)

export interface CalendarEventItem {
  id: number;
  title: string;
  startDate: string;
  endDate: string | null;
}

export interface CalendarScheduleItem {
  workDate: string;
  staffId: number;
  startMin: number;
  endMin: number;
}

export interface CalendarDayCell {
  date: string;
  inMonth: boolean;
  isToday: boolean;
  events: CalendarEventItem[];
  staffIds: number[];
}

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function parseUtc(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

// month("YYYY-MM") → 월요일 시작 주 단위 그리드
export function buildMonthGrid(
  month: string,
  todayKst: string,
  events: CalendarEventItem[],
  schedule: CalendarScheduleItem[]
): CalendarDayCell[][] {
  const [year, mon] = month.split("-").map(Number);
  const first = new Date(Date.UTC(year, mon - 1, 1));
  const daysInMonth = new Date(Date.UTC(year, mon, 0)).getUTCDate();
  const lead = (first.getUTCDay() + 6) % 7; // 월요일=0 기준 앞 채움 일수
  const totalCells = Math.ceil((lead + daysInMonth) / 7) * 7;

  // 날짜별 이벤트 전개 (기간 이벤트는 각 날짜에 복제)
  const eventsByDate = new Map<string, CalendarEventItem[]>();
  for (const ev of events) {
    const end = parseUtc(ev.endDate ?? ev.startDate);
    for (let d = parseUtc(ev.startDate); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
      const key = toDateStr(d);
      const list = eventsByDate.get(key) ?? [];
      list.push(ev);
      eventsByDate.set(key, list);
    }
  }

  const staffByDate = new Map<string, Set<number>>();
  for (const s of schedule) {
    const set = staffByDate.get(s.workDate) ?? new Set<number>();
    set.add(s.staffId);
    staffByDate.set(s.workDate, set);
  }

  const weeks: CalendarDayCell[][] = [];
  const cursor = new Date(Date.UTC(year, mon - 1, 1 - lead));
  for (let i = 0; i < totalCells; i += 1) {
    const date = toDateStr(cursor);
    const cell: CalendarDayCell = {
      date,
      inMonth: cursor.getUTCMonth() === mon - 1,
      isToday: date === todayKst,
      events: eventsByDate.get(date) ?? [],
      staffIds: [...(staffByDate.get(date) ?? [])].sort((a, b) => a - b),
    };
    if (i % 7 === 0) weeks.push([]);
    weeks[weeks.length - 1].push(cell);
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return weeks;
}

export function formatMinute(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}
