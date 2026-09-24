"use client";

import { useEffect, useRef, useState } from "react";
import { BOOKS, type BookId } from "@/lib/book/books";
import type { Stage } from "./engine/stage";

// WebGL 3D 책 시험판 — three.js는 이 화면에서만 동적으로 불러온다
export function BookGLLab() {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const backRef = useRef<HTMLImageElement>(null);
  const deskRef = useRef<HTMLImageElement>(null);
  const stageRef = useRef<Stage | null>(null);
  const [current, setCurrent] = useState<BookId>("home");
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [speed, setSpeed] = useState(1);
  const [layers, setLayers] = useState(true);
  const [hand, setHand] = useState(true);

  useEffect(() => {
    let stage: Stage | null = null;
    let cancelled = false;
    const onResize = () => stage?.layout();
    (async () => {
      const [{ Stage }] = await Promise.all([import("./engine/stage")]);
      const root = rootRef.current;
      const canvas = canvasRef.current;
      if (cancelled || !root || !canvas) return;
      const css = getComputedStyle(root);
      const fonts = {
        serif: css.getPropertyValue("--font-hahmlet").trim() || "serif",
        sans: css.getPropertyValue("--font-gowun").trim() || "sans-serif",
      };
      stage = new Stage(canvas, { back: backRef.current, top: deskRef.current }, fonts);
      await stage.init("home");
      if (cancelled) return stage.dispose();
      stageRef.current = stage;
      window.addEventListener("resize", onResize);
      setBusy(false);
      BOOKS.forEach((b) => b.id !== "home" && stage?.preload(b.id));
    })().catch((e: unknown) => {
      setError(e instanceof Error ? e.message : "3D 장면을 만들지 못했습니다");
    });
    return () => {
      cancelled = true;
      window.removeEventListener("resize", onResize);
      stage?.dispose();
      stageRef.current = null;
    };
  }, []);

  const pick = async (id: BookId) => {
    const stage = stageRef.current;
    if (!stage || busy || id === current) return;
    setBusy(true);
    try {
      await stage.swap(id, {
        speed,
        hand,
        layers,
        reduce: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
      });
      setCurrent(id);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "책을 바꾸지 못했습니다");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div ref={rootRef} className="lab-root">
      {/* eslint-disable-next-line @next/next/no-img-element -- 시험판 정적 그림 */}
      <img ref={backRef} className="lab-layer lab-back" src="/home/book/art/desk-back.webp" alt="" />
      {/* eslint-disable-next-line @next/next/no-img-element -- 시험판 정적 그림 */}
      <img ref={deskRef} className="lab-layer lab-desk" src="/home/book/art/desk-top.webp" alt="" />
      {/* eslint-disable-next-line @next/next/no-img-element -- 시험판 정적 그림 */}
      <img className="lab-layer lab-mobile" src="/home/book/art/desk-m.webp" alt="" />
      <canvas ref={canvasRef} className="lab-gl" aria-label="책상 위의 책" />
      {error && <p className="lab-error">{error}</p>}
      <nav className="lab-controls" aria-label="시험판 조작">
        <span className="lab-badge">3D 책 시험판</span>
        <div className="lab-books">
          {BOOKS.map((b) => (
            <button key={b.id} type="button" aria-pressed={b.id === current} disabled={busy} onClick={() => pick(b.id)}>
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
