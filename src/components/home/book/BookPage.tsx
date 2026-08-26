"use client";

import { pageOffsetX } from "@/lib/bookCamera";
import { layerOpen, PAGE_W, roomsOfPage, type BookPageDef } from "@/lib/homeBook";
import { Jail } from "./Jail";
import { PaperLayer } from "./PaperLayer";

// 면 하나 — 왼쪽 변을 축으로 접힌다(fold 0→1 = 0°→-75°). 판들은 open 진행도에 따라 일어선다.
const FOLD_ANGLE = -(75 * Math.PI) / 180;

export function BookPage({
  page,
  index,
  open,
  fold,
  showJail,
}: {
  page: BookPageDef;
  index: number;
  open: number;
  fold: number;
  showJail: boolean;
}) {
  const ox = pageOffsetX(index);
  return (
    <group position={[ox - PAGE_W / 2, 0, 0]} rotation={[0, fold * FOLD_ANGLE, 0]}>
      <group position={[PAGE_W / 2, 0, 0]}>
        {page.layers.map((l) => (
          <PaperLayer key={l.id} def={l} open={layerOpen(l, open)} />
        ))}
        {roomsOfPage(page.id).map((room) =>
          room.layers.map((l) => (
            <group key={l.id} position={[room.cameraIn.x, 0, 0]}>
              <PaperLayer def={l} open={layerOpen(l, open)} />
            </group>
          ))
        )}
        {showJail && (
          <Jail tally={page.jailTally} open={layerOpen({ open: 0.45, duration: 0.3 }, open)} x={PAGE_W / 2 + 0.2} />
        )}
      </group>
    </group>
  );
}
