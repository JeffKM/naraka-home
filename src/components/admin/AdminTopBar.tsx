"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { postJson } from "@/lib/api/client";

// 어드민 콘솔 상단 바 — 루트 레이아웃 축소로 Header가 사라져 로그아웃 수단이 없어짐(머지 블로커 #3).
// 로그아웃 동작은 AuthButton과 동일 패턴(postJson 후 하드 내비게이션으로 세션·캐시 완전 초기화).
export function AdminTopBar() {
  async function logout() {
    await postJson("/api/auth/logout");
    window.location.href = "/event/login";
  }

  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-lg items-center justify-between px-4">
        <Link href="/" className="font-semibold">
          나라카 콘솔
        </Link>
        <Button size="sm" variant="ghost" onClick={logout} className="text-muted-foreground">
          로그아웃
        </Button>
      </div>
    </header>
  );
}
