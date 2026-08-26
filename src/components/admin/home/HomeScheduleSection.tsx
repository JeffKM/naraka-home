"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { HomeScheduleEntry, HomeStaff } from "@/types/home";
import { adminHomeFetch } from "./adminHomeApi";

interface DraftEntry {
  staffId: number;
  start: string; // "HH:MM"
  end: string;   // "HH:MM" (24:00 허용)
}

function toMin(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function toHhmm(min: number): string {
  return `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
}

// 출근표 — 하루 단위로 스태프×시간대 행을 편집하고 통째로 저장한다
export function HomeScheduleSection() {
  const [staff, setStaff] = useState<HomeStaff[]>([]);
  const [date, setDate] = useState("");
  const [rows, setRows] = useState<DraftEntry[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const data = await adminHomeFetch<{ staff: HomeStaff[] }>(
          "/api/admin/home/staff"
        );
        setStaff(data.staff.filter((s) => s.isActive));
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "스태프 조회 실패");
      }
    })();
  }, []);

  const loadDay = useCallback(async (d: string) => {
    try {
      const data = await adminHomeFetch<{ entries: HomeScheduleEntry[] }>(
        `/api/admin/home/schedule?start=${d}&end=${d}`
      );
      setRows(
        data.entries.map((e) => ({
          staffId: e.staffId,
          start: toHhmm(e.startMin),
          end: toHhmm(e.endMin),
        }))
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "출근표 조회 실패");
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 날짜 선택 시 해당 일자 출근표 로드, 외부 API 동기화
    if (date) void loadDay(date);
  }, [date, loadDay]);

  async function save() {
    if (!date) return toast.error("날짜를 선택해주세요.");
    setBusy(true);
    try {
      await adminHomeFetch("/api/admin/home/schedule", {
        method: "PUT",
        body: JSON.stringify({
          workDate: date,
          entries: rows.map((r) => ({
            staffId: r.staffId,
            startMin: toMin(r.start),
            endMin: toMin(r.end),
          })),
        }),
      });
      toast.success("출근표 저장 완료");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "저장 실패");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 pt-4">
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        {date && (
          <>
            {rows.map((row, i) => (
              <div key={i} className="flex items-center gap-2">
                <select
                  className="h-9 flex-1 rounded-md border bg-transparent px-2 text-sm"
                  value={row.staffId}
                  onChange={(e) => {
                    const next = [...rows];
                    next[i] = { ...row, staffId: Number(e.target.value) };
                    setRows(next);
                  }}
                >
                  {staff.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                <Input
                  type="time"
                  className="w-28"
                  value={row.start}
                  onChange={(e) => {
                    const next = [...rows];
                    next[i] = { ...row, start: e.target.value };
                    setRows(next);
                  }}
                />
                <span className="text-sm">~</span>
                <Input
                  type="time"
                  className="w-28"
                  value={row.end}
                  onChange={(e) => {
                    const next = [...rows];
                    next[i] = { ...row, end: e.target.value };
                    setRows(next);
                  }}
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setRows(rows.filter((_, j) => j !== i))}
                >
                  제거
                </Button>
              </div>
            ))}
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={staff.length === 0}
                onClick={() =>
                  setRows([
                    ...rows,
                    { staffId: staff[0].id, start: "12:00", end: "18:00" },
                  ])
                }
              >
                출근 추가
              </Button>
              <Button size="sm" className="ml-auto" disabled={busy} onClick={save}>
                이 날짜 저장
              </Button>
            </div>
            {staff.length === 0 && (
              <p className="text-xs text-muted-foreground">
                먼저 스태프를 등록해주세요.
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
