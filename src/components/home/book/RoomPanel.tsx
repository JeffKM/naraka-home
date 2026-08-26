"use client";

import Link from "next/link";
import { useEffect, useRef, type ReactNode } from "react";
import type { BookRoomDef } from "@/lib/homeBook";

// 방 정보 패널 — 3D 위에 겹치는 한지 시트. 내용은 서버가 children으로 채운다.
export function RoomPanel({
  room,
  onClose,
  children,
}: {
  room: BookRoomDef | null;
  onClose: () => void;
  children: ReactNode;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (room) closeRef.current?.focus();
  }, [room]);
  if (!room) return null;
  const external = room.href.startsWith("http");
  return (
    <div className="home-book-panel" role="dialog" aria-modal="false" aria-labelledby="home-book-panel-title">
      <div className="home-paper p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <h2 id="home-book-panel-title" className="home-plate text-lg font-semibold">
            {room.title}
          </h2>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="home-ui inline-flex min-h-11 min-w-11 items-center justify-center text-sm"
          >
            닫기
          </button>
        </div>
        <div className="mt-3 text-sm">{children}</div>
        {external ? (
          <a href={room.href} target="_blank" rel="noreferrer" className="home-btn mt-4 inline-flex min-h-11 items-center px-4 text-sm">
            {room.hrefLabel}
          </a>
        ) : (
          <Link href={room.href} className="home-btn mt-4 inline-flex min-h-11 items-center px-4 text-sm">
            {room.hrefLabel}
          </Link>
        )}
      </div>
    </div>
  );
}
