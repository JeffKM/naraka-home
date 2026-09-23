"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, type CSSProperties, type ReactNode, type RefObject } from "react";
import { applyScrollTops } from "@/lib/book/dom";
import type { FlipDir } from "@/lib/book/input";
import { flipBackstopMs } from "@/lib/book/navigation";
import { BookCopyContext } from "./bookCopyContext";

interface Props {
  oldNode: ReactNode;
  newNode: ReactNode;
  dir: FlipDir;
  leaves: number; // 후루룩 빈 장 수
  spread: boolean; // 데스크톱 양면이면 true
  reducedMotion: boolean;
  oldScrollTops: RefObject<number[]>; // 넘기기 직전 쪽의 스크롤 위치
  onDone: () => void;
}

// 넘김 연출 — 전부 aria-hidden·inert 복제본. 실제 새 쪽(book-live)은 아래에 이미 깔려 있다.
// 양면: 앞면 = 직전 쪽의 넘어가는 반쪽, 뒷면 = 새 쪽의 반대 반쪽. 한 쪽(모바일): 다음=직전 쪽이 넘어감, 이전=새 쪽이 넘어옴.
export function FlipLayer({ oldNode, newNode, dir, leaves, spread, reducedMotion, oldScrollTops, onDone }: Props) {
  const underRef = useRef<HTMLDivElement>(null);
  const frontRef = useRef<HTMLDivElement>(null);
  const fwd = dir === 1;
  const frontIsOld = spread || fwd;

  // 끝 알림은 한 번만 — animationend와 안전 타이머 중 먼저 온 쪽
  const onDoneRef = useRef(onDone);
  const doneRef = useRef(false);
  useLayoutEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);
  const finish = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    onDoneRef.current();
  }, []);
  // animationend가 끝내 안 오면(탭 숨김·애니메이션 취소) 연출 시간 + 여유 뒤 강제로 끝낸다
  useEffect(() => {
    const t = window.setTimeout(finish, flipBackstopMs(leaves, reducedMotion));
    return () => window.clearTimeout(t);
  }, [finish, leaves, reducedMotion]);

  // 복제본도 직전 쪽의 스크롤 위치에서 넘어가게
  useLayoutEffect(() => {
    const tops = oldScrollTops.current ?? [];
    if (underRef.current) applyScrollTops(underRef.current, tops);
    if (frontRef.current && frontIsOld) applyScrollTops(frontRef.current, tops);
  }, [oldScrollTops, frontIsOld]);

  if (reducedMotion) {
    return (
      <BookCopyContext value={true}>
        <div className="flip-layer" aria-hidden inert>
          <div ref={underRef} className="flip-fade book-paper" onAnimationEnd={finish}>
            {oldNode}
          </div>
        </div>
      </BookCopyContext>
    );
  }

  const underNode = spread || !fwd ? oldNode : null;
  const frontNode = frontIsOld ? oldNode : newNode;
  const backNode = spread ? newNode : null;
  const style = { "--rush": leaves } as CSSProperties;

  return (
    <BookCopyContext value={true}>
      <div
        className="flip-layer"
        aria-hidden
        inert
        data-dir={fwd ? "next" : "prev"}
        data-spread={spread ? "true" : "false"}
        data-rush={leaves > 0 ? "true" : "false"}
        style={style}
      >
        {underNode && (
          <div ref={underRef} className="flip-under book-paper">
            {underNode}
          </div>
        )}
        {Array.from({ length: leaves }, (_, i) => (
          <div key={i} className="flip-leaf flip-leaf-blank" style={{ "--i": i } as CSSProperties}>
            <div className="flip-face flip-front book-paper" />
            <div className="flip-face flip-back book-paper" />
          </div>
        ))}
        <div
          className="flip-leaf flip-leaf-main"
          style={{ "--i": leaves } as CSSProperties}
          onAnimationEnd={(e) => {
            if (e.target === e.currentTarget) finish();
          }}
        >
          <div className="flip-face flip-front book-paper">
            <div ref={frontRef} className="flip-clip">
              {frontNode}
            </div>
          </div>
          <div className="flip-face flip-back book-paper">
            {backNode && <div className="flip-clip">{backNode}</div>}
          </div>
        </div>
      </div>
    </BookCopyContext>
  );
}
