"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Vector3 } from "three";
import { easeInOutCubic, pageCamera, roomCamera, type CameraPose } from "@/lib/bookCamera";
import { BOOK_PAGES, findRoom } from "@/lib/homeBook";
import { BookPage } from "./BookPage";
import { useBookScroll } from "./useBookScroll";

const AUTO_OPEN_MS = 1200;
const DOLLY_IN_MS = 900;
const DOLLY_OUT_MS = 600;

// 카메라 리그 — 목표 자세로 시간 기반 보간(스크롤·클릭 모두 같은 경로)
function CameraRig({ pose, durationMs }: { pose: CameraPose; durationMs: number }) {
  const { camera } = useThree();
  const from = useRef({ pos: new Vector3(), tgt: new Vector3() });
  const cur = useRef({ pos: new Vector3(...pose.position), tgt: new Vector3(...pose.target) });
  const start = useRef(0);
  const dur = useRef(durationMs);

  useEffect(() => {
    from.current.pos.copy(cur.current.pos);
    from.current.tgt.copy(cur.current.tgt);
    start.current = performance.now();
    dur.current = durationMs;
  }, [pose, durationMs]);

  useFrame(() => {
    const k = easeInOutCubic((performance.now() - start.current) / dur.current);
    cur.current.pos.lerpVectors(from.current.pos, new Vector3(...pose.position), k);
    cur.current.tgt.lerpVectors(from.current.tgt, new Vector3(...pose.target), k);
    camera.position.copy(cur.current.pos);
    camera.lookAt(cur.current.tgt);
  });
  return null;
}

export function PopupBook({
  activeRoom,
  onRoomChange,
  children,
}: {
  activeRoom: string | null;
  onRoomChange: (id: string | null) => void;
  children?: ReactNode;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scroll = useBookScroll(containerRef, BOOK_PAGES.length);
  const [portrait, setPortrait] = useState(false);
  // 자동 1회 열림 — 시간 기반. 면 0의 open은 스크롤과 무관하게 이 값이 상한.
  const [autoOpen, setAutoOpen] = useState(0);

  useEffect(() => {
    const mq = window.matchMedia("(orientation: portrait)");
    const sync = () => setPortrait(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    let raf = 0;
    const t0 = performance.now();
    const step = () => {
      const k = Math.min(1, (performance.now() - t0) / AUTO_OPEN_MS);
      setAutoOpen(k);
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, []);

  // 방에 들어가 있으면 스크롤은 무시하고 방 카메라 유지. Esc로 나감.
  useEffect(() => {
    if (!activeRoom) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onRoomChange(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeRoom, onRoomChange]);

  const room = activeRoom ? findRoom(activeRoom) : undefined;
  const roomPageIndex = room ? BOOK_PAGES.findIndex((p) => p.id === room.pageId) : -1;
  const { pose, durationMs } = useMemo(() => {
    if (room && roomPageIndex >= 0) return { pose: roomCamera(room, roomPageIndex), durationMs: DOLLY_IN_MS };
    return { pose: pageCamera(scroll.page, portrait), durationMs: activeRoom === null ? DOLLY_OUT_MS : 0 };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- scroll.page·portrait·room만 의존
  }, [room, roomPageIndex, scroll.page, portrait]);

  return (
    <div ref={containerRef} className="home-book" style={{ height: `${BOOK_PAGES.length * 100}vh` }}>
      <div className="home-book-stage">
        <Canvas
          aria-hidden
          dpr={[1, 1.5]}
          camera={{ fov: 40, near: 0.1, far: 200, position: pageCamera(0, false).position }}
          gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
        >
          <CameraRig pose={pose} durationMs={durationMs} />
          {BOOK_PAGES.map((p, i) => (
            <BookPage
              key={p.id}
              page={p}
              index={i}
              open={i === 0 ? Math.min(autoOpen, scroll.open[0]) : scroll.open[i]}
              fold={scroll.fold[i]}
              showJail={i < BOOK_PAGES.length - 1}
            />
          ))}
        </Canvas>
        {children}
      </div>
    </div>
  );
}
