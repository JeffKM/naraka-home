"use client";

import { useState } from "react";
import { PopupBook } from "./PopupBook";

// 임시 연결 — Task 6에서 정식 컨트롤러로 교체하며 삭제한다.
export function PopupBookDev() {
  const [room, setRoom] = useState<string | null>(null);
  return <PopupBook activeRoom={room} onRoomChange={setRoom} />;
}
