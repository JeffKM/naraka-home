"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Vector3 } from "three";
import { easeInOutCubic, pageCamera, roomCamera, type CameraPose } from "@/lib/bookCamera";
import { BOOK_PAGES, findRoom } from "@/lib/homeBook";
import { BookPage } from "./BookPage";
import { RoomPlates } from "./RoomPlates";
import { useBookScroll } from "./useBookScroll";

const AUTO_OPEN_MS = 1200;
const DOLLY_IN_MS = 900;
const DOLLY_OUT_MS = 600;
/** SSR·측정 전 기본 화면 비율 (가로 데스크톱 가정) */
const DEFAULT_ASPECT = 1.6;
const ROOM_HASH = /^#room=([\w-]+)$/;

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
    // 0이면 0/0 = NaN이 되어 카메라가 영구히 망가진다. 최소 1ms로 고정.
    dur.current = Math.max(1, durationMs);
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
  const [aspect, setAspect] = useState(
    // 첫 프레임부터 제 거리로 그리도록 지연 초기화 (SSR에서는 window가 없다)
    () => (typeof window === "undefined" ? DEFAULT_ASPECT : window.innerWidth / window.innerHeight)
  );
  // 자동 1회 열림 — 시간 기반. 면 0의 open은 스크롤과 무관하게 이 값이 상한.
  const [autoOpen, setAutoOpen] = useState(0);
  // 마운트 1회 효과가 낡은 콜백을 붙잡지 않도록 최신값을 ref로 들고 있는다.
  // (렌더 중 ref 쓰기는 금지라 커밋 뒤에 맞춘다 — 해시 효과보다 먼저 선언해 순서를 보장)
  const onRoomChangeRef = useRef(onRoomChange);
  // 우리가 밀어 넣은 히스토리 항목의 해시 — 나갈 때 그 항목이 아직 맨 위일 때만 되돌린다
  const pushed = useRef("");

  useEffect(() => {
    onRoomChangeRef.current = onRoomChange;
  }, [onRoomChange]);

  useEffect(() => {
    const sync = () => setAspect(window.innerWidth / window.innerHeight);
    sync();
    window.addEventListener("resize", sync, { passive: true });
    return () => window.removeEventListener("resize", sync);
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

  // URL 해시 — 방 진입을 뒤로 가기·공유에 남긴다 (#room=office)
  useEffect(() => {
    const fromHash = () => {
      const m = ROOM_HASH.exec(window.location.hash);
      const id = m && findRoom(m[1]) ? m[1] : null;
      // 방이 없는 해시로 돌아왔다 = 사용자가 직접 뒤로 갔다. 되돌릴 항목도 사라졌다.
      if (!id) pushed.current = "";
      onRoomChangeRef.current(id);
    };
    fromHash();
    window.addEventListener("hashchange", fromHash);
    return () => window.removeEventListener("hashchange", fromHash);
  }, []);

  useEffect(() => {
    const want = activeRoom ? `#room=${activeRoom}` : "";
    if (window.location.hash === want) return;
    if (want) {
      history.pushState(null, "", want);
      pushed.current = want;
    } else if (pushed.current && window.location.hash === pushed.current) {
      // 우리가 넣은 항목이 아직 맨 위다 — 되돌린다(hashchange가 나고 fromHash가 null을 다시 세팅, 무동작)
      pushed.current = "";
      history.back();
    } else {
      // 그 사이 다른 항목이 쌓였으면 뒤로 가기가 엉뚱한 곳으로 간다 — 해시만 지운다
      pushed.current = "";
      history.replaceState(null, "", window.location.pathname + window.location.search);
    }
  }, [activeRoom]);

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
    return { pose: pageCamera(scroll.page, aspect), durationMs: activeRoom === null ? DOLLY_OUT_MS : 0 };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- scroll.page·aspect·room만 의존
  }, [room, roomPageIndex, scroll.page, aspect]);

  return (
    <div ref={containerRef} className="home-book" style={{ height: `${BOOK_PAGES.length * 100}vh` }}>
      <div className="home-book-stage">
        <Canvas
          // aria-hidden을 Canvas에 주면 R3F가 컨테이너 div에 얹어 명패 버튼까지 숨는다.
          // 장식인 canvas 요소에만 직접 건다.
          onCreated={({ gl }) => gl.domElement.setAttribute("aria-hidden", "true")}
          dpr={[1, 1.5]}
          camera={{ fov: 40, near: 0.1, far: 200, position: pageCamera(0, aspect).position }}
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
          <RoomPlates pageIndex={scroll.page} activeRoom={activeRoom} onSelect={onRoomChange} />
        </Canvas>
        {children}
      </div>
    </div>
  );
}
