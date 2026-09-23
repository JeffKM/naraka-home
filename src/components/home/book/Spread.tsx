import type { ReactNode } from "react";
import { ArtPlate } from "./ArtPlate";

const CORNERS = ["tl", "tr", "bl", "br"] as const;

// 펼친 양면 (데스크톱) / 한 쪽 (모바일). data-book-scroll = 휠·스와이프가 먼저 스크롤할 칸 후보.
// 종이(질감·모서리 장식)는 스크롤되지 않는 바깥 판, 글은 안쪽 칸이 스크롤한다 —
// 넘김 복제본도 이 구조를 통째로 떠 가므로 넘기는 동안에도 질감·장식이 그대로다
export function Spread({ left, right }: { left: ReactNode; right: ReactNode }) {
  return (
    <article className="book-spread book-paper">
      <div className="book-spread-body" data-book-scroll="">
        <section className="book-page book-page-left">{left}</section>
        <section className="book-page book-page-right" data-book-scroll="">
          {right}
        </section>
      </div>
      {/* 바깥 네 모서리 장식 — 좌상단 원본을 뒤집어 쓴다 */}
      {CORNERS.map((c) => (
        <ArtPlate key={c} art="corner" className={`book-corner book-corner-${c}`} />
      ))}
    </article>
  );
}

// 쪽마다 하나 — 넘김이 끝나면 무대가 여기로 포커스를 옮긴다
export function PageTitle({ children }: { children: ReactNode }) {
  return (
    <h1
      data-book-title=""
      tabIndex={-1}
      className="home-serif text-2xl font-extrabold leading-tight outline-none"
    >
      {children}
    </h1>
  );
}

export function PageIllust({ src, alt }: { src: string; alt: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- 스토리 원화 정적 WebP
    <img src={src} alt={alt} className="book-illust" loading="lazy" />
  );
}

export function MissingNote({ children }: { children: ReactNode }) {
  return (
    <p role="status" className="home-card mb-4 px-3 py-2 text-sm">
      {children}
    </p>
  );
}
