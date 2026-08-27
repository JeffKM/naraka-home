"use client";

import type { PaperLayerDef } from "@/lib/homeBook";
import { PaperLayer } from "./PaperLayer";

// 경첩 감옥 — 면의 오른쪽 끝(다음 면과의 접힌 자리)에 선다. 빗금 수에 따라 텍스처만 바뀐다.
const JAIL_SRC: Record<5 | 10 | 15, string | null> = {
  5: null,
  10: null,
  15: null,
};

export function Jail({ tally, open, x }: { tally: 5 | 10 | 15; open: number; x: number }) {
  const def: PaperLayerDef = {
    id: `jail-${tally}`,
    src: JAIL_SRC[tally],
    w: 2.6,
    h: 3.8,
    x,
    y: 0,
    z: -1.2,
    hinge: "bottom",
    open: 0.45,
    duration: 0.3,
    tint: "#515151",
    label: `감옥 · 빗금 ${tally}`,
  };
  return <PaperLayer def={def} open={open} />;
}
