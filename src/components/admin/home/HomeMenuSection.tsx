"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { HomeMenuItem } from "@/types/home";
import { adminHomeFetch } from "./adminHomeApi";
import { ImageUploadButton } from "./ImageUploadButton";

const EMPTY = {
  category: "",
  name: "",
  price: "",
  description: "",
  imageUrl: null as string | null,
};

export function HomeMenuSection() {
  const [items, setItems] = useState<HomeMenuItem[]>([]);
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    try {
      const data = await adminHomeFetch<{ items: HomeMenuItem[] }>(
        "/api/admin/home/menu"
      );
      setItems(data.items);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "목록 조회 실패");
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 마운트 시 최초 목록 로드, 외부 API 동기화
    void reload();
  }, [reload]);

  async function add() {
    const price = Number(form.price);
    if (!form.category.trim() || !form.name.trim()) {
      return toast.error("카테고리와 이름을 입력해주세요.");
    }
    if (!Number.isInteger(price) || price < 0) {
      return toast.error("가격은 0 이상의 정수(원)여야 합니다.");
    }
    setBusy(true);
    try {
      await adminHomeFetch("/api/admin/home/menu", {
        method: "POST",
        body: JSON.stringify({
          category: form.category,
          name: form.name,
          price,
          description: form.description,
          imageUrl: form.imageUrl,
        }),
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
      await adminHomeFetch(`/api/admin/home/menu/${id}`, {
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
      await adminHomeFetch(`/api/admin/home/menu/${id}`, { method: "DELETE" });
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
              placeholder="카테고리 (예: 디저트)"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            />
            <Input
              placeholder="이름"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <Input
              placeholder="가격(원)"
              inputMode="numeric"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
            />
          </div>
          <Input
            placeholder="설명"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <div className="flex items-center gap-2">
            <ImageUploadButton
              onUploaded={(url) => setForm({ ...form, imageUrl: url })}
            />
            {form.imageUrl && (
              <span className="text-xs text-muted-foreground">사진 첨부됨</span>
            )}
            <Button size="sm" className="ml-auto" disabled={busy} onClick={add}>
              등록
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-2">
        {items.map((it) => (
          <Card key={it.id}>
            <CardContent className="flex items-center gap-2 py-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">
                  [{it.category}] {it.name} · {it.price.toLocaleString("ko-KR")}원
                  {it.isSoldOut ? " (품절)" : ""}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {it.description}
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => patch(it.id, { isSoldOut: !it.isSoldOut })}
              >
                {it.isSoldOut ? "판매 재개" : "품절"}
              </Button>
              <Button size="sm" variant="destructive" onClick={() => remove(it.id)}>
                삭제
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
