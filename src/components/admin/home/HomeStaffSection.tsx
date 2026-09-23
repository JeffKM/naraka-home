"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { HomeStaff } from "@/types/home";
import { adminHomeFetch } from "./adminHomeApi";
import { ImageUploadButton } from "./ImageUploadButton";

const EMPTY = { name: "", role: "", intro: "", photoUrl: null as string | null };

export function HomeStaffSection() {
  const [staff, setStaff] = useState<HomeStaff[]>([]);
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    try {
      const data = await adminHomeFetch<{ staff: HomeStaff[] }>(
        "/api/admin/home/staff"
      );
      setStaff(data.staff);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "목록 조회 실패");
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 마운트 시 최초 목록 로드, 외부 API 동기화
    void reload();
  }, [reload]);

  async function add() {
    if (!form.name.trim()) return toast.error("이름을 입력해주세요.");
    setBusy(true);
    try {
      await adminHomeFetch("/api/admin/home/staff", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setForm(EMPTY);
      toast.success("등록 완료");
      await reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "등록 실패");
    } finally {
      setBusy(false);
    }
  }

  async function patch(id: number, body: Record<string, unknown>) {
    try {
      await adminHomeFetch(`/api/admin/home/staff/${id}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
      await reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "수정 실패");
    }
  }

  async function remove(id: number) {
    try {
      await adminHomeFetch(`/api/admin/home/staff/${id}`, { method: "DELETE" });
      await reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "삭제 실패");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardContent className="flex flex-col gap-2 pt-4">
          <div className="flex gap-2">
            <Input
              placeholder="이름"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <Input
              placeholder="역할 (예: 마녀)"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            />
          </div>
          <Textarea
            placeholder="소개"
            rows={2}
            value={form.intro}
            onChange={(e) => setForm({ ...form, intro: e.target.value })}
          />
          <div className="flex items-center gap-2">
            <ImageUploadButton
              onUploaded={(url) => setForm({ ...form, photoUrl: url })}
            />
            {form.photoUrl && (
              <span className="text-xs text-muted-foreground">사진 첨부됨</span>
            )}
            <Button size="sm" className="ml-auto" disabled={busy} onClick={add}>
              등록
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-2">
        {staff.map((s) => (
          <Card key={s.id}>
            <CardContent className="flex items-center gap-3 py-3">
              {s.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- 어드민 미리보기, 외부 최적화 불필요
                <img
                  src={s.photoUrl}
                  alt={s.name}
                  className="size-10 rounded-full object-cover"
                />
              ) : (
                <div className="flex size-10 items-center justify-center rounded-full bg-muted text-xs">
                  없음
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">
                  {s.name}
                  {s.role ? ` · ${s.role}` : ""}
                  {!s.isActive ? " (숨김)" : ""}
                </p>
                <p className="truncate text-xs text-muted-foreground">{s.intro}</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => patch(s.id, { isActive: !s.isActive })}
              >
                {s.isActive ? "숨기기" : "표시"}
              </Button>
              <Button size="sm" variant="destructive" onClick={() => remove(s.id)}>
                삭제
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
