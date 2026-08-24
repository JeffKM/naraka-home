"use client";

import Link from "next/link";
import { useState } from "react";
import {
  formatMinute,
  shiftMonth,
  type CalendarDayCell,
} from "@/lib/homeCalendar";
import type { HomeScheduleEntry, HomeStaff } from "@/types/home";
import { StaffAvatar } from "./StaffAvatar";

const WEEKDAYS = ["월", "화", "수", "목", "금", "토", "일"];

interface Props {
  month: string;
  weeks: CalendarDayCell[][];
  staff: HomeStaff[];
  daySchedule: Record<string, HomeScheduleEntry[]>;
}

// 이벤트 달력 + 요괴 출근표 (여정의 종착지이자 홈 핵심 정보)
export function CalendarSection({ month, weeks, staff, daySchedule }: Props) {
  const staffById = new Map(staff.map((s) => [s.id, s]));
  const today = weeks.flat().find((c) => c.isToday);
  const [selected, setSelected] = useState<string | null>(today?.date ?? null);
  const selectedCell = weeks.flat().find((c) => c.date === selected) ?? null;
  const selectedEntries = selected ? (daySchedule[selected] ?? []) : [];

  return (
    <section id="calendar" className="mx-auto max-w-3xl px-4 py-10">
      <div className="home-paper p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <h2 className="flex items-baseline gap-2 text-xl font-semibold">
          이번 달의 나라카
          <span className="home-tally text-sm" aria-hidden>
            {"////"}
          </span>
        </h2>
        <div className="home-ui flex items-center gap-3 text-sm">
          <Link
            href={`/?month=${shiftMonth(month, -1)}#calendar`}
            className="hover:text-[var(--home-burgundy)]"
          >
            이전 달
          </Link>
          <span className="tabular-nums">{month.replace("-", ".")}</span>
          <Link
            href={`/?month=${shiftMonth(month, 1)}#calendar`}
            className="hover:text-[var(--home-burgundy)]"
          >
            다음 달
          </Link>
        </div>
      </div>

      <div className="home-wood-frame mt-4">
      <div className="home-ui grid grid-cols-7 gap-1 text-center text-xs text-[var(--home-muted)]">
        {WEEKDAYS.map((d) => (
          <div key={d} className="py-1">{d}</div>
        ))}
      </div>
      {weeks.map((week, wi) => (
        <div key={wi} className="mt-1 grid grid-cols-7 gap-1">
          {week.map((cell) => (
            <button
              key={cell.date}
              type="button"
              onClick={() => setSelected(cell.date)}
              className={[
                "flex min-h-16 flex-col items-start gap-1 rounded-lg p-1 text-left",
                cell.inMonth
                  ? "bg-[var(--home-surface)]"
                  : "bg-transparent text-[var(--home-cream)] opacity-50",
                cell.isToday
                  ? "border-[2.5px] border-[var(--home-burgundy)] bg-[var(--home-surface)]"
                  : "border border-transparent",
                selected === cell.date && !cell.isToday
                  ? "ring-2 ring-[var(--home-amber)]"
                  : "",
                selected === cell.date && cell.isToday
                  ? "ring-2 ring-[var(--home-amber)] ring-offset-1"
                  : "",
              ].join(" ")}
            >
              <span
                className={[
                  "home-ui text-xs tabular-nums",
                  cell.isToday ? "text-[var(--home-burgundy)]" : "",
                ].join(" ")}
              >
                {Number(cell.date.slice(8))}
              </span>
              {cell.events.length > 0 && (
                <span className="max-w-full truncate rounded border border-[#b49b63] bg-[var(--home-paper-deep)] px-1 text-[10px] font-semibold text-[var(--home-ink)]">
                  {cell.events[0].title}
                  {cell.events.length > 1 ? ` 외 ${cell.events.length - 1}` : ""}
                </span>
              )}
              {cell.staffIds.length > 0 && (
                <span className="flex -space-x-1">
                  {cell.staffIds.slice(0, 4).map((id) => {
                    const s = staffById.get(id);
                    return s ? <StaffAvatar key={id} staff={s} size={18} /> : null;
                  })}
                </span>
              )}
            </button>
          ))}
        </div>
      ))}
      </div>

      {selectedCell && (
        <div className="home-lacquer-panel mt-4 p-4">
          <h3 className="home-ui text-base">
            {selectedCell.date.replaceAll("-", ".")}
            {selectedCell.isToday ? " (오늘)" : ""}
          </h3>
          <div className="mt-2 flex flex-col gap-1 text-sm">
            {selectedCell.events.map((ev) => (
              <Link
                key={ev.id}
                href={`/events/${ev.id}`}
                className="text-[var(--home-burgundy)] underline underline-offset-2"
              >
                {ev.title}
              </Link>
            ))}
            {selectedCell.events.length === 0 && (
              <p className="text-[var(--home-muted)]">예정된 이벤트가 없습니다.</p>
            )}
          </div>
          <h4 className="mt-3 text-sm font-semibold">출근 요괴</h4>
          <div className="mt-1 flex flex-col gap-1 text-sm">
            {selectedEntries.map((e) => {
              const s = staffById.get(e.staffId);
              if (!s) return null;
              return (
                <div key={e.id} className="flex items-center gap-2">
                  <StaffAvatar staff={s} />
                  <span>{s.name}</span>
                  <span className="ml-auto tabular-nums text-[var(--home-muted)]">
                    {formatMinute(e.startMin)} ~ {formatMinute(e.endMin)}
                  </span>
                </div>
              );
            })}
            {selectedEntries.length === 0 && (
              <p className="text-[var(--home-muted)]">출근 정보가 아직 없습니다.</p>
            )}
          </div>
        </div>
      )}
      </div>
    </section>
  );
}
