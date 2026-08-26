"use client";

import { Html } from "@react-three/drei";
import { pageOffsetX } from "@/lib/bookCamera";
import { BOOK_PAGES, roomsOfPage } from "@/lib/homeBook";

// 명패 — 판 좌표에 HTML 버튼을 얹는다. 현재 면의 것만 보이고 방에 들어가면 숨긴다.
export function RoomPlates({
  pageIndex,
  activeRoom,
  onSelect,
}: {
  pageIndex: number;
  activeRoom: string | null;
  onSelect: (id: string) => void;
}) {
  const page = BOOK_PAGES[pageIndex];
  if (!page || activeRoom) return null;
  const ox = pageOffsetX(pageIndex);
  return (
    <>
      {roomsOfPage(page.id).map((room) => (
        <Html key={room.id} position={[ox + room.plate.x, room.plate.y, 0.2]} center zIndexRange={[20, 10]}>
          <button
            type="button"
            className="home-book-plate"
            onClick={() => onSelect(room.id)}
            aria-label={`${room.label} — ${room.title} 들어가기`}
          >
            {room.label}
          </button>
        </Html>
      ))}
    </>
  );
}
