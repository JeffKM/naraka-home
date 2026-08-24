"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

interface JourneyScene {
  id: string;
  label: string;
  image: string;
}

interface JourneyManifest {
  mode: "stills" | "frames";
  scenes: JourneyScene[];
  frames: {
    basePath: string;
    pattern: string;
    count: number;
    mobileBasePath: string;
    mobileCount: number;
  };
}

const SEEN_KEY = "naraka-journey-seen";

function frameUrl(base: string, pattern: string, index: number): string {
  return `${base}/${pattern.replace("%04d", String(index + 1).padStart(4, "0"))}`;
}

// 스크롤 스크럽 여정 히어로 (인트로형 4장면 — scroll-world 방식 자체 구현)
// - stills 모드: 장면 정지 이미지를 진행도에 따라 크로스페이드 (에셋 도착 전 기본)
// - frames 모드: WebP 프레임 시퀀스를 canvas에 스크럽 (실제 비행 클립 추출본)
// - 안전장치: 건너뛰기 앵커 / prefers-reduced-motion 정적 폴백 / 재방문 축약
export function ScrubJourney() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const framesRef = useRef<(HTMLImageElement | null)[]>([]);
  const [manifest, setManifest] = useState<JourneyManifest | null>(null);
  const [progress, setProgress] = useState(0);
  const [collapsed, setCollapsed] = useState(false);
  const [reduced, setReduced] = useState(false);

  // 초기화: 매니페스트 로드 + 재방문·모션 축소 판정
  useEffect(() => {
    try {
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
      // eslint-disable-next-line react-hooks/set-state-in-effect -- 마운트 시 최초 모션 축소 판정, 외부 API 동기화
      if (mq.matches) setReduced(true);
    } catch {
      // matchMedia 미지원 환경은 풀 여정 유지
    }
    try {
      if (window.localStorage.getItem(SEEN_KEY) === "1") setCollapsed(true);
      else window.localStorage.setItem(SEEN_KEY, "1");
    } catch {
      // 저장 불가(시크릿 모드 등)면 항상 풀 여정
    }
    void fetch("/journey/manifest.json")
      .then((r) => (r.ok ? (r.json() as Promise<JourneyManifest>) : null))
      .then((m) => setManifest(m))
      .catch(() => setManifest(null));
  }, []);

  // frames 모드: 프레임 지연 로드
  useEffect(() => {
    if (!manifest || manifest.mode !== "frames" || manifest.frames.count === 0) return;
    framesRef.current = new Array<HTMLImageElement | null>(
      manifest.frames.count
    ).fill(null);
    for (let i = 0; i < manifest.frames.count; i += 1) {
      const img = new Image();
      img.src = frameUrl(manifest.frames.basePath, manifest.frames.pattern, i);
      img.onload = () => {
        framesRef.current[i] = img;
      };
    }
  }, [manifest]);

  // 스크롤 → 진행도 (rAF 스로틀)
  useEffect(() => {
    if (collapsed || reduced) return;
    let raf = 0;
    function onScroll() {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const el = wrapRef.current;
        if (!el) return;
        const total = el.offsetHeight - window.innerHeight;
        if (total <= 0) return;
        const scrolled = Math.min(Math.max(-el.getBoundingClientRect().top, 0), total);
        setProgress(scrolled / total);
      });
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [collapsed, reduced]);

  // frames 모드: 진행도에 해당하는 프레임을 canvas에 그린다
  useEffect(() => {
    if (!manifest || manifest.mode !== "frames") return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const idx = Math.min(
      manifest.frames.count - 1,
      Math.floor(progress * manifest.frames.count)
    );
    // 가장 가까운 로드 완료 프레임을 찾아 그린다 (미로드 구간 검은 화면 방지)
    for (let i = idx; i >= 0; i -= 1) {
      const img = framesRef.current[i];
      if (img) {
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        ctx.drawImage(img, 0, 0);
        break;
      }
    }
  }, [progress, manifest]);

  if (!manifest || manifest.scenes.length === 0) return null;

  const scenes = manifest.scenes;

  // 정적 폴백 (모션 축소) 또는 재방문 축약 히어로
  if (reduced || collapsed) {
    return (
      <section className="relative">
        {/* eslint-disable-next-line @next/next/no-img-element -- 여정 에셋 */}
        <img
          src={scenes[0].image}
          alt={scenes[0].label}
          className="h-[60vh] w-full object-cover"
        />
        <div className="absolute inset-x-0 bottom-6 flex justify-center gap-3">
          {collapsed && !reduced && (
            <button
              type="button"
              className="home-btn px-4 py-1.5 text-sm"
              onClick={() => {
                setCollapsed(false);
                try {
                  window.localStorage.removeItem(SEEN_KEY);
                } catch {
                  // 무시 — 저장 불가 환경
                }
              }}
            >
              여정 다시 보기
            </button>
          )}
          <Link
            href="#calendar"
            className="home-btn home-btn-primary px-4 py-1.5 text-sm"
          >
            달력·출근표 보기
          </Link>
        </div>
      </section>
    );
  }

  // 풀 여정: 장면당 120vh 스크롤 구간, sticky 뷰포트에 크로스페이드/프레임 스크럽
  const sceneFloat = progress * (scenes.length - 1);
  const current = Math.min(scenes.length - 1, Math.floor(sceneFloat));
  const blend = sceneFloat - current;

  return (
    <div ref={wrapRef} style={{ height: `${scenes.length * 120}vh` }}>
      <div className="sticky top-0 h-dvh overflow-hidden bg-[var(--home-stage)]">
        {manifest.mode === "frames" && manifest.frames.count > 0 ? (
          <canvas ref={canvasRef} className="size-full object-cover" />
        ) : (
          scenes.map((scene, i) => (
            // eslint-disable-next-line @next/next/no-img-element -- 여정 에셋
            <img
              key={scene.id}
              src={scene.image}
              alt={scene.label}
              className="absolute inset-0 size-full object-cover transition-opacity duration-300"
              style={{
                opacity: i === current ? 1 - blend : i === current + 1 ? blend : 0,
              }}
            />
          ))
        )}
        <button
          type="button"
          className="home-btn home-ui absolute right-4 top-4 px-3 py-1 text-sm"
          onClick={() =>
            document.getElementById("calendar")?.scrollIntoView({ behavior: "smooth" })
          }
        >
          건너뛰기
        </button>
        <p className="absolute inset-x-0 bottom-4 text-center text-xs text-[var(--home-surface)]/80">
          스크롤해서 나라카로 들어가기
        </p>
      </div>
    </div>
  );
}
