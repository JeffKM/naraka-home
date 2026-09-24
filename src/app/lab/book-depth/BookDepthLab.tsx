"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BOOKS } from "@/lib/book/books";
import { storySrc } from "@/lib/book/art";
import { Book3D } from "./Book3D";

type BookId = (typeof BOOKS)[number]["id"];

// 시험판 쪽 내용 — 책마다 제목·원화 한 장·짧은 글
const PAGE: Record<BookId, { story: number; line: string }> = {
  home: { story: 13, line: "사고 치다 붙잡힌 요괴들이 일하는 동성로의 작은 지옥." },
  about: { story: 1, line: "옥자님의 채용 공고는 늘 한 줄. 종신 계약." },
  location: { story: 5, line: "동성로 골목 끝, 파란 불꽃이 새어 나오는 문." },
  menu: { story: 12, line: "주방요괴가 차리는 오늘의 메뉴판." },
  staff: { story: 3, line: "오늘 출근한 요괴들을 확인하세요." },
  notice: { story: 9, line: "옥자님이 붙인 공지가 여기 모입니다." },
  events: { story: 15, line: "이번 달 지옥에서 열리는 일들." },
  games: { story: 17, line: "마작 한 판, 지는 쪽이 설거지." },
};

type Refs = { book: HTMLDivElement | null; hinge: HTMLDivElement | null; shade: HTMLDivElement | null; hand: HTMLDivElement | null };

// 타임라인(ms, 1배속) — 덮기 → 물러나며 눕히기 → 밀어내고 들이기 → 다가오며 펼치기
const T = {
  closeEnd: 380,
  zoomOutStart: 180,
  zoomOutEnd: 600,
  slideStart: 600,
  slideEnd: 900,
  zoomInStart: 900,
  zoomInEnd: 1280,
  openStart: 940,
  openEnd: 1320,
};
const EASE_TURN = "cubic-bezier(0.55, 0, 0.3, 1)";
const EASE_CAM = "cubic-bezier(0.45, 0, 0.2, 1)";

export function BookDepthLab() {
  const [current, setCurrent] = useState<BookId>("home");
  const [incoming, setIncoming] = useState<BookId | null>(null);
  const [speed, setSpeed] = useState(1);
  const [layers, setLayers] = useState(true);
  const [hand, setHand] = useState(true);
  const refs = useRef<Partial<Record<BookId, Refs>>>({});
  const backRef = useRef<HTMLImageElement>(null);
  const deskRef = useRef<HTMLImageElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [geo, setGeo] = useState<{ pw: number; ph: number; ax: number; mobile: boolean } | null>(null);

  // 쪽 크기 — 데스크톱은 펼친 양면(3:2)의 한 쪽, 모바일은 화면 폭 한 쪽
  useEffect(() => {
    const measure = () => {
      const el = stageRef.current;
      if (!el) return;
      const w = el.clientWidth;
      const h = el.clientHeight;
      const mobile = window.innerWidth < 768;
      if (mobile) {
        const pw = w - 32;
        setGeo({ pw, ph: h - 16, ax: 16, mobile });
      } else {
        const sw = Math.min(w - 160, (h - 24) * 1.5);
        setGeo({ pw: sw / 2, ph: sw / 1.5, ax: w / 2, mobile });
      }
    };
    const t = window.setTimeout(measure, 0);
    window.addEventListener("resize", measure);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("resize", measure);
    };
  }, []);

  const bind = useCallback(
    (id: BookId, key: keyof Refs) => (el: HTMLDivElement | null) => {
      refs.current[id] = { ...(refs.current[id] ?? { book: null, hinge: null, shade: null, hand: null }), [key]: el };
    },
    [],
  );

  // 교체 연출 — incoming이 그려진 뒤 시작한다 (애니메이션 시작은 부수효과라 이펙트에서, 상태 변경은 끝난 뒤 비동기로)
  useEffect(() => {
    if (!incoming || !geo || !stageRef.current) return;
    const from = refs.current[current];
    const to = refs.current[incoming];
    if (!from?.book || !from.hinge || !to?.book || !to.hinge) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const k = reduce ? 0.001 : 1 / speed;
    const stageW = stageRef.current.clientWidth;
    // 닫힌 책이 책상 위 가운데 눕는 자리 — 책 중심을 무대 가운데로, 뒤로 눕히고 줄인다
    const s = geo.mobile ? 0.62 : 0.5;
    const dx = stageW / 2 - (geo.ax + geo.pw / 2);
    const REST = "translate3d(0,0,0) rotateX(0deg) rotateY(0deg) rotateZ(0deg) scale(1)";
    const DESK = `translate3d(${dx}px, 4%, 0) rotateX(36deg) rotateY(-16deg) rotateZ(-5deg) scale(${s})`;
    const OUT_L = `translate3d(${dx - stageW * 0.95}px, 0%, 60px) rotateX(36deg) rotateY(-10deg) rotateZ(-12deg) scale(${s})`;
    const IN_R = `translate3d(${dx + stageW * 0.95}px, 0%, 60px) rotateX(36deg) rotateY(-22deg) rotateZ(4deg) scale(${s})`;
    const o = (delay: number, end: number, easing: string) => ({
      delay: delay * k,
      duration: Math.max(1, (end - delay) * k),
      easing,
      fill: "both" as const,
    });
    const anims: Animation[] = [];
    const add = (el: Element | null, frames: Keyframe[], opt: KeyframeAnimationOptions) => {
      if (el) anims.push(el.animate(frames, opt));
    };

    // 덮기: 왼쪽 면(앞표지 안쪽)이 책등을 축으로 넘어와 오른쪽 쪽 위에 닫힌다. 모로 설 때 가장 어둡다
    add(from.hinge, [{ transform: "rotateY(-180deg)" }, { transform: "rotateY(-2deg)", offset: 0.9 }, { transform: "rotateY(0deg)" }], o(0, T.closeEnd, EASE_TURN));
    add(from.shade, [{ opacity: 0.6 }, { opacity: 0 }], o(T.closeEnd * 0.5, T.closeEnd, "ease-out"));
    // 물러나며 책상에 눕힌 뒤 왼쪽으로 밀려 나간다 (한 요소에 애니메이션을 겹치면 뒤엣것이 앞 구간까지 덮으므로 한 줄로)
    const fromSpan = T.slideEnd - T.zoomOutStart;
    add(from.book, [
      { transform: REST, easing: EASE_CAM },
      { transform: DESK, offset: (T.zoomOutEnd - T.zoomOutStart) / fromSpan, easing: "cubic-bezier(0.5, 0, 0.85, 0.4)" },
      { transform: DESK, offset: (T.slideStart - T.zoomOutStart) / fromSpan, easing: "cubic-bezier(0.5, 0, 0.85, 0.4)" },
      { transform: OUT_L },
    ], o(T.zoomOutStart, T.slideEnd, "linear"));
    // 새 책이 오른쪽에서 미끄러져 들어와 → 다가오며 → 앞표지가 열린다
    const toStart = T.slideStart + 40;
    const toSpan = T.zoomInEnd - toStart;
    add(to.book, [
      { transform: IN_R, easing: "cubic-bezier(0.15, 0.6, 0.25, 1)" },
      { transform: DESK, offset: (T.slideEnd - toStart) / toSpan, easing: EASE_CAM },
      { transform: DESK, offset: (T.zoomInStart - toStart) / toSpan, easing: EASE_CAM },
      { transform: REST },
    ], o(toStart, T.zoomInEnd, "linear"));
    add(to.hinge, [{ transform: "rotateY(0deg)" }, { transform: "rotateY(-180deg)" }], o(T.openStart, T.openEnd, EASE_TURN));
    add(to.shade, [{ opacity: 0 }, { opacity: 0.6 }], o(T.openStart, (T.openStart + T.openEnd) / 2, "ease-in"));
    if (hand && to.hand) {
      add(to.hand, [
        { transform: "translateX(22%)", opacity: 0 },
        { transform: "translateX(0)", opacity: 1, offset: 0.2 },
        { opacity: 1, offset: 0.45 },
        { transform: `translateX(${-geo.pw * 0.9}px)`, opacity: 0, offset: 0.7 },
        { transform: `translateX(${-geo.pw * 0.9}px)`, opacity: 0 },
      ], o(T.openStart - 120, T.openEnd, EASE_TURN));
    }
    // 책상 2.5D 겹 — 펼친 상태는 가까이(확대), 책이 눕는 동안 물러나고, 새 책이 들어올 때 옆으로 흘렀다가 다시 다가간다.
    // 앞 겹(책상)이 뒤 겹(벽·바닥)보다 크게 움직여 깊이가 생긴다
    if (layers && !geo.mobile) {
      const cam = (near: number, drift: number) => [
        { transform: `translateX(0) scale(${near})`, offset: 0 },
        { transform: "translateX(0) scale(1)", offset: T.zoomOutEnd / T.zoomInEnd },
        { transform: `translateX(${drift}px) scale(1)`, offset: T.slideEnd / T.zoomInEnd },
        { transform: `translateX(0) scale(${near})`, offset: 1 },
      ];
      add(deskRef.current, cam(1.12, -46), o(0, T.zoomInEnd, EASE_CAM));
      add(backRef.current, cam(1.05, -14), o(0, T.zoomInEnd, EASE_CAM));
    }

    let alive = true;
    Promise.all(anims.map((a) => a.finished))
      .then(() => {
        if (!alive) return;
        setCurrent(incoming);
        setIncoming(null);
        // 남은 fill을 걷어 CSS 기본값(펼친 상태)으로 — 한 프레임 뒤에
        window.requestAnimationFrame(() => anims.forEach((a) => a.cancel()));
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
    // current는 교체 시작 시점 값만 쓴다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incoming]);

  const pick = (id: BookId) => {
    if (incoming || id === current) return;
    setIncoming(id);
  };

  const shown: BookId[] = incoming ? [current, incoming] : [current];

  return (
    <div className="lab-root">
      {/* eslint-disable-next-line @next/next/no-img-element -- 시험판 정적 그림 */}
      <img ref={backRef} className="lab-layer lab-back" src="/home/book/art/desk-back.webp" alt="" />
      {/* eslint-disable-next-line @next/next/no-img-element -- 시험판 정적 그림 */}
      <img ref={deskRef} className="lab-layer lab-desk" src="/home/book/art/desk-top.webp" alt="" />
      {/* eslint-disable-next-line @next/next/no-img-element -- 시험판 정적 그림 */}
      <img className="lab-layer lab-mobile" src="/home/book/art/desk-m.webp" alt="" />
      <div ref={stageRef} className="lab-stage">
        {geo && (
          <div
            className="lab-anchor"
            style={{ "--pw": `${geo.pw}px`, "--ph": `${geo.ph}px`, left: geo.ax } as React.CSSProperties}
          >
            {shown.map((id) => {
              const b = BOOKS.find((x) => x.id === id)!;
              const p = PAGE[id];
              return (
                <Book3D
                  key={id}
                  id={id}
                  ref={bind(id, "book")}
                  hingeRef={bind(id, "hinge")}
                  shadeRef={bind(id, "shade")}
                  handRef={bind(id, "hand")}
                  incoming={id === incoming}
                  left={
                    <>
                      <p className="lab-kicker">{b.title}</p>
                      <h1 className="home-serif lab-title">{id === "home" ? "오늘의 나라카" : b.title}</h1>
                      {/* eslint-disable-next-line @next/next/no-img-element -- 시험판 정적 그림 */}
                      <img className="lab-illust" src={storySrc(p.story)} alt="" />
                    </>
                  }
                  right={
                    <>
                      <p className="lab-line">{p.line}</p>
                      <div className="lab-rule" />
                      <p className="lab-muted">시험판 쪽입니다. 실제 내용은 기존 쪽이 그대로 들어갑니다.</p>
                    </>
                  }
                />
              );
            })}
          </div>
        )}
      </div>
      <nav className="lab-controls" aria-label="시험판 조작">
        <span className="lab-badge">입체 시험판</span>
        <div className="lab-books">
          {BOOKS.map((b) => (
            <button
              key={b.id}
              type="button"
              aria-pressed={b.id === current}
              disabled={!!incoming}
              onClick={() => pick(b.id)}
            >
              {b.title}
            </button>
          ))}
        </div>
        <div className="lab-toggles">
          <button type="button" aria-pressed={speed < 1} onClick={() => setSpeed(speed < 1 ? 1 : 0.3)}>
            느리게
          </button>
          <button type="button" aria-pressed={layers} onClick={() => setLayers(!layers)}>
            책상 겹
          </button>
          <button type="button" aria-pressed={hand} onClick={() => setHand(!hand)}>
            손
          </button>
        </div>
      </nav>
    </div>
  );
}
