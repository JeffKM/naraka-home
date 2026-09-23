import type { CSSProperties } from "react";
import { BOOKS, type BookId } from "@/lib/book/books";
import { spineRect, type PctRect } from "@/lib/book/shelf";
import { ArtPicture, ArtPlate } from "./ArtPlate";

export function pctRectStyle(r: PctRect): CSSProperties {
  return { left: `${r.left}%`, top: `${r.top}%`, width: `${r.width}%`, height: `${r.height}%` };
}

interface Props {
  pull: BookId; // 손이 뽑아낼 책
  tuck?: BookId; // 막 덮어서 제자리 빈칸으로 들어가는 책 (책 교체)
  className?: string;
}

// 책장 장면 — 흐리게 깐 집무실 위에 책장 판을 비율 그대로 두고, 가운데 줄 세로 칸 8개에 책등을 꽂는다.
// 칸 좌표는 그림을 재서 잡은 상수(lib/book/shelf). 연출(꽂기·뽑기)은 book.css가 data-phase로 건다
export function ShelfScene({ pull, tuck, className = "" }: Props) {
  return (
    <div className={`shelf-scene ${className}`}>
      <div className="shelf-backdrop">
        <ArtPicture desktop="office" mobile="office-m" className="shelf-backdrop-art" />
      </div>
      <div className="shelf-frame">
        <ArtPlate art="shelf" className="shelf-art" />
        {BOOKS.map((b) => {
          const style = pctRectStyle(spineRect(b.id));
          if (b.id === pull) {
            return (
              <div key={b.id} className="shelf-pull" style={style}>
                <ArtPlate art={`spine-${b.id}`} className="shelf-spine-art" />
                {/* 손 그림에 딸린 갈색 책은 clip-path로 오려 내고, 손가락 사이로 이 책등이 보이게 한다 */}
                <div className="shelf-hand">
                  <ArtPlate art="hand-pull" className="size-full" />
                </div>
              </div>
            );
          }
          return (
            <div key={b.id} className={`shelf-spine${b.id === tuck ? " is-tuck" : ""}`} style={style}>
              <ArtPlate art={`spine-${b.id}`} className="shelf-spine-art" />
            </div>
          );
        })}
      </div>
    </div>
  );
}
