"use client";

import { useLayoutEffect, useRef, type CSSProperties, type ReactNode, type RefObject } from "react";
import { applyScrollTops } from "@/lib/book/dom";
import type { FlipDir } from "@/lib/book/input";
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
          <div ref={underRef} className="flip-fade" onAnimationEnd={onDone}>
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
          <div ref={underRef} className="flip-under">
            {underNode}
          </div>
        )}
        {Array.from({ length: leaves }, (_, i) => (
          <div key={i} className="flip-leaf flip-leaf-blank" style={{ "--i": i } as CSSProperties}>
            <div className="flip-face flip-front" />
            <div className="flip-face flip-back" />
          </div>
        ))}
        <div
          className="flip-leaf flip-leaf-main"
          style={{ "--i": leaves } as CSSProperties}
          onAnimationEnd={(e) => {
            if (e.target === e.currentTarget) onDone();
          }}
        >
          <div className="flip-face flip-front">
            <div ref={frontRef} className="flip-clip">
              {frontNode}
            </div>
          </div>
          <div className="flip-face flip-back">
            {backNode && <div className="flip-clip">{backNode}</div>}
          </div>
        </div>
      </div>
    </BookCopyContext>
  );
}
