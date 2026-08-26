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

// 기간 이벤트를 칸마다 제목으로 반복하면 한 달짜리 이벤트가 30칸을 똑같이 채운다.
// 대신 구간 정보를 실어 "시작일·주 첫 칸에만 제목, 나머지는 이어짐 띠"로 그린다.
export interface CalendarDayEvent extends CalendarEventItem {
  /** 이벤트 실제 시작일 — 띠 왼쪽 끝을 둥글게 */
  isStart: boolean;
  /** 이벤트 실제 종료일 — 띠 오른쪽 끝을 둥글게 */
  isEnd: boolean;
  /** 제목을 쓰는 칸 (실제 시작일 또는 그 주의 첫 칸) */
  showLabel: boolean;
}

export interface CalendarDayCell {
  date: string;
  inMonth: boolean;
  isToday: boolean;
  events: CalendarDayEvent[];
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

  // 날짜별 이벤트 전개 — 기간 이벤트는 각 날짜에 구간 정보와 함께 복제.
  // 시작일 순 정렬로 여러 이벤트가 겹칠 때 칸마다 띠 순서가 뒤집히지 않게 한다.
  const sorted = [...events].sort(
    (a, b) => a.startDate.localeCompare(b.startDate) || a.id - b.id
  );
  const eventsByDate = new Map<string, CalendarDayEvent[]>();
  for (const ev of sorted) {
    const endStr = ev.endDate ?? ev.startDate;
    const end = parseUtc(endStr);
    for (let d = parseUtc(ev.startDate); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
      const key = toDateStr(d);
      const list = eventsByDate.get(key) ?? [];
      list.push({
        ...ev,
        isStart: key === ev.startDate,
        isEnd: key === endStr,
        showLabel: key === ev.startDate, // 주 첫 칸 여부는 그리드 조립 때 덧붙인다
      });
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
    const isWeekStart = i % 7 === 0; // 월요일 = 줄바꿈 지점이라 제목을 다시 쓴다
    const cell: CalendarDayCell = {
      date,
      inMonth: cursor.getUTCMonth() === mon - 1,
      isToday: date === todayKst,
      events: (eventsByDate.get(date) ?? []).map((ev) => ({
        ...ev,
        showLabel: ev.showLabel || isWeekStart,
      })),
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
