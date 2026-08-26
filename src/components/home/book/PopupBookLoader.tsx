"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { findRoom } from "@/lib/homeBook";
import { BookFallback } from "./BookFallback";
import { RoomPanel } from "./RoomPanel";

// three 번들은 여기서만 로드 — 홈 외 페이지엔 실리지 않는다
const PopupBook = dynamic(() => import("./PopupBook").then((m) => m.PopupBook), {
  ssr: false,
  loading: () => <BookFallback />,
});

type Nav = Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };

// 구독할 외부 스토어가 없다 — 렌더마다 새 함수를 넘기지 않도록 모듈 상수로 둔다
const noopSubscribe = () => () => {};

// 감지는 한 번이면 충분하다 — canvas 생성 비용을 렌더마다 치르지 않도록 모듈 수준에 캐시한다
let cached: boolean | undefined;
function canRun3dOnce(): boolean {
  return (cached ??= canRun3d());
}

function canRun3d(): boolean {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  const nav = navigator as Nav;
  if (nav.deviceMemory !== undefined && nav.deviceMemory < 2) return false;
  if (nav.connection?.saveData) return false;
  try {
    const c = document.createElement("canvas");
    return Boolean(c.getContext("webgl2") ?? c.getContext("webgl"));
  } catch {
    return false;
  }
}

export function PopupBookLoader({ panels }: { panels: Record<string, ReactNode> }) {
  // 서버·하이드레이션 시점엔 브라우저 능력을 알 수 없다 — 그때는 폴백을 그리고, 붙은 뒤 판정한다
  // (useEffect + setState는 캐스케이딩 렌더를 만들어 react-hooks/set-state-in-effect에 걸린다)
  const can3d = useSyncExternalStore(noopSubscribe, canRun3dOnce, () => false);
  const [room, setRoom] = useState<string | null>(null);
  // 방을 닫았을 때 포커스를 돌려줄 명패 — 마지막으로 연 방
  const lastRoom = useRef<string | null>(null);

  useEffect(() => {
    if (room) {
      lastRoom.current = room;
      return;
    }
    const last = lastRoom.current;
    if (!last) return;
    lastRoom.current = null;
    // 명패는 방을 닫은 뒤에야 다시 그려진다 — 한 프레임 미룬 뒤 포커스를 되돌린다
    const raf = requestAnimationFrame(() => {
      document.querySelector<HTMLButtonElement>(`.home-book-plate[data-room="${last}"]`)?.focus();
    });
    return () => cancelAnimationFrame(raf);
  }, [room]);

  if (!can3d) return <BookFallback />;
  const def = room ? findRoom(room) ?? null : null;
  return (
    <PopupBook activeRoom={room} onRoomChange={setRoom}>
      <RoomPanel room={def} onClose={() => setRoom(null)}>
        {def ? panels[def.id] : null}
      </RoomPanel>
    </PopupBook>
  );
}
