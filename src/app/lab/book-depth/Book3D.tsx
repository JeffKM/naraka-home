import { forwardRef, type ReactNode } from "react";

// 두께 있는 책 — 원점은 책등(제본선). 닫히면 오른쪽(0 ~ 쪽 폭)에 놓이고,
// 앞표지(경첩)는 책등을 축으로 -180°까지 열려 왼쪽 면(속지 + 왼쪽 쪽)이 된다.
// 뒤표지 → 속지 덩어리(윗면 = 오른쪽 쪽, 옆면 3개 = 종이 결) → 앞표지 순으로 z를 쌓는다
export const Book3D = forwardRef<
  HTMLDivElement,
  {
    id: string;
    left: ReactNode;
    right: ReactNode;
    incoming?: boolean;
    hingeRef?: React.Ref<HTMLDivElement>;
    shadeRef?: React.Ref<HTMLDivElement>;
    handRef?: React.Ref<HTMLDivElement>;
  }
>(function Book3D({ id, left, right, incoming, hingeRef, shadeRef, handRef }, ref) {
  return (
    <div ref={ref} className="b3d" data-incoming={incoming ? "" : undefined}>
      <div className="b3d-floor-shadow" />
      <div className="b3d-back" />
      <div className="b3d-edge b3d-edge-fore" />
      <div className="b3d-edge b3d-edge-top" />
      <div className="b3d-edge b3d-edge-bottom" />
      <div className="b3d-spine">
        {/* eslint-disable-next-line @next/next/no-img-element -- 시험판 정적 그림 */}
        <img src={`/home/book/art/spine-${id}.webp`} alt="" draggable={false} />
      </div>
      <div className="b3d-page b3d-page-right book-paper">{right}</div>
      <div ref={hingeRef} className="b3d-hinge">
        <div className="b3d-cover">
          {/* eslint-disable-next-line @next/next/no-img-element -- 시험판 정적 그림 */}
          <img src={`/home/book/art/cover-${id}.webp`} alt="" draggable={false} />
          <div ref={shadeRef} className="b3d-cover-shade" />
        </div>
        <div className="b3d-page b3d-page-left book-paper">{left}</div>
      </div>
      {/* 옥자 손 — 손끝(그림 왼쪽 끝)이 앞표지 오른쪽 끝을 짚고, 소매는 화면 밖까지 이어진다 */}
      <div ref={handRef} className="b3d-hand">
        {/* eslint-disable-next-line @next/next/no-img-element -- 시험판 정적 그림 */}
        <img src="/home/book/art/hand-reach.webp" alt="" draggable={false} />
      </div>
    </div>
  );
});
