"use client";

import { useState } from "react";
import { findRoom } from "@/lib/homeBook";
import { PopupBook } from "./PopupBook";
import { RoomPanel } from "./RoomPanel";

// 임시 연결 — Task 6에서 정식 컨트롤러로 교체하며 삭제한다.
export function PopupBookDev() {
  const [room, setRoom] = useState<string | null>(null);
  return (
    <PopupBook activeRoom={room} onRoomChange={setRoom}>
      <RoomPanel room={room ? findRoom(room) ?? null : null} onClose={() => setRoom(null)}>
        <p>임시 내용</p>
      </RoomPanel>
    </PopupBook>
  );
}
