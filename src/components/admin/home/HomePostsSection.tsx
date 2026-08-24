"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { HomePost, HomePostType } from "@/types/home";
import { adminHomeFetch } from "./adminHomeApi";
import { ImageUploadButton } from "./ImageUploadButton";

const EMPTY = {
  type: "notice" as HomePostType,
  title: "",
  bodyMd: "",
  coverImageUrl: null as string | null,
  pinned: false,
  eventStartDate: "",
  eventEndDate: "",
};

// 홈 공지·이벤트 작성/목록 — 이벤트는 달력 표시용 날짜 필수
export function HomePostsSection() {
  const [posts, setPosts] = useState<HomePost[]>([]);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    try {
      const { posts } = await adminHomeFetch<{ posts: HomePost[] }>(
        "/api/admin/home/posts"
      );
      setPosts(posts);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "목록 조회 실패");
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 마운트 시 최초 목록 로드, 외부 API 동기화
    void reload();
  }, [reload]);

  async function submit() {
    if (!form.title.trim()) return toast.error("제목을 입력해주세요.");
    if (form.type === "event" && !form.eventStartDate) {
      return toast.error("이벤트는 시작일이 필요합니다.");
    }
    setBusy(true);
    try {
      const body = {
        type: form.type,
        title: form.title,
        bodyMd: form.bodyMd,
        coverImageUrl: form.coverImageUrl,
        pinned: form.pinned,
        eventStartDate: form.type === "event" ? form.eventStartDate : null,
        eventEndDate:
          form.type === "event" && form.eventEndDate ? form.eventEndDate : null,
      };
      if (editingId === null) {
        await adminHomeFetch("/api/admin/home/posts", {
          method: "POST",
          body: JSON.stringify(body),
        });
      } else {
        await adminHomeFetch(`/api/admin/home/posts/${editingId}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        });
      }
      setForm(EMPTY);
      setEditingId(null);
      toast.success("저장 완료");
      await reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "저장 실패");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: number) {
    try {
      await adminHomeFetch(`/api/admin/home/posts/${id}`, { method: "DELETE" });
      toast.success("삭제 완료");
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
            <Button
              size="sm"
              variant={form.type === "notice" ? "default" : "outline"}
              onClick={() => setForm({ ...form, type: "notice" })}
            >
              공지
            </Button>
            <Button
              size="sm"
              variant={form.type === "event" ? "default" : "outline"}
              onClick={() => setForm({ ...form, type: "event" })}
            >
              이벤트
            </Button>
            <label className="ml-auto flex items-center gap-1 text-sm">
              <input
                type="checkbox"
                checked={form.pinned}
                onChange={(e) => setForm({ ...form, pinned: e.target.checked })}
              />
              고정
            </label>
          </div>
          <Input
            placeholder="제목"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          {form.type === "event" && (
            <div className="flex items-center gap-2 text-sm">
              <Input
                type="date"
                value={form.eventStartDate}
                onChange={(e) =>
                  setForm({ ...form, eventStartDate: e.target.value })
                }
              />
              <span>~</span>
              <Input
                type="date"
                value={form.eventEndDate}
                onChange={(e) =>
                  setForm({ ...form, eventEndDate: e.target.value })
                }
              />
            </div>
          )}
          <Textarea
            placeholder="본문 (마크다운)"
            rows={6}
            value={form.bodyMd}
            onChange={(e) => setForm({ ...form, bodyMd: e.target.value })}
          />
          <div className="flex items-center gap-2">
            <ImageUploadButton
              onUploaded={(url) => setForm({ ...form, coverImageUrl: url })}
            />
            {form.coverImageUrl && (
              <span className="truncate text-xs text-muted-foreground">
                대표 이미지 첨부됨
              </span>
            )}
            <Button size="sm" className="ml-auto" disabled={busy} onClick={submit}>
              {editingId === null ? "등록" : "수정 저장"}
            </Button>
            {editingId !== null && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setEditingId(null);
                  setForm(EMPTY);
                }}
              >
                취소
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-2">
        {posts.map((p) => (
          <Card key={p.id}>
            <CardContent className="flex items-center gap-2 py-3">
              <Badge variant={p.type === "event" ? "default" : "secondary"}>
                {p.type === "event" ? "이벤트" : "공지"}
              </Badge>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {p.pinned ? "[고정] " : ""}
                  {p.title}
                </p>
                {p.type === "event" && (
                  <p className="text-xs text-muted-foreground">
                    {p.eventStartDate}
                    {p.eventEndDate ? ` ~ ${p.eventEndDate}` : ""}
                  </p>
                )}
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setEditingId(p.id);
                  setForm({
                    type: p.type,
                    title: p.title,
                    bodyMd: p.bodyMd,
                    coverImageUrl: p.coverImageUrl,
                    pinned: p.pinned,
                    eventStartDate: p.eventStartDate ?? "",
                    eventEndDate: p.eventEndDate ?? "",
                  });
                }}
              >
                수정
              </Button>
              <Button size="sm" variant="destructive" onClick={() => remove(p.id)}>
                삭제
              </Button>
            </CardContent>
          </Card>
        ))}
        {posts.length === 0 && (
          <p className="py-4 text-center text-sm text-muted-foreground">
            아직 작성한 글이 없습니다.
          </p>
        )}
      </div>
    </div>
  );
}
