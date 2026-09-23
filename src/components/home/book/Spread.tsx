import type { ReactNode } from "react";

// 펼친 양면 (데스크톱) / 한 쪽 (모바일). data-book-scroll = 휠·스와이프가 먼저 스크롤할 칸 후보
export function Spread({ left, right }: { left: ReactNode; right: ReactNode }) {
  return (
    <article className="book-spread" data-book-scroll="">
      <section className="book-page book-page-left">{left}</section>
      <section className="book-page book-page-right" data-book-scroll="">
        {right}
      </section>
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
