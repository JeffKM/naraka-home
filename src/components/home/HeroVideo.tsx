"use client";

import { useEffect, useRef } from "react";

// 히어로 루프 영상 — 음소거 자동재생, 모션 축소 환경에선 정지(포스터만 노출)
export function HeroVideo({ className }: { className?: string }) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    try {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        video.pause();
        video.removeAttribute("autoplay");
      }
    } catch {
      // matchMedia 미지원 환경은 자동재생 유지
    }
  }, []);

  return (
    <video
      ref={ref}
      className={className}
      src="/home/hero-loop.mp4"
      poster="/home/hero-poster.webp"
      autoPlay
      muted
      loop
      playsInline
      preload="metadata"
      aria-hidden
      tabIndex={-1}
    />
  );
}
