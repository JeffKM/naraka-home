"use client";

import { create } from "zustand";
import type { BookId } from "./books";
import type { BookPageRef } from "./navigation";

// 책 무대 UI 상태 — 서버 데이터는 두지 않는다 (쪽 순서표는 각 쪽이 등록)
export interface CurrentPage {
  book: BookId;
  key: string;
  manifest: readonly BookPageRef[];
}

export interface SwapRequest {
  id: number;
  from: BookId;
  to: BookId;
  fast: boolean; // 교체 연출 도중 다시 고름 → 중간 건너뛰기
}

interface BookState {
  current: CurrentPage | null;
  drawerOpen: boolean;
  swapRequest: SwapRequest | null;
  // 인트로(정지 그림 판) 재생 중 — 참이면 뒤 요소(상단 바·책 무대)를 inert 처리
  introActive: boolean;
  register: (page: CurrentPage) => void;
  setDrawerOpen: (open: boolean) => void;
  requestSwap: (from: BookId, to: BookId) => void;
  clearSwap: (id: number) => void;
  setIntroActive: (active: boolean) => void;
  // 책 레이아웃을 떠날 때 — 모듈 전역 스토어라 서랍·교체 요청이 다음 방문까지 남지 않게
  resetUi: () => void;
}

let swapSeq = 0;

export const useBookStore = create<BookState>()((set) => ({
  current: null,
  drawerOpen: false,
  swapRequest: null,
  introActive: false,
  register: (current) => set({ current }),
  setDrawerOpen: (drawerOpen) => set({ drawerOpen }),
  requestSwap: (from, to) =>
    set((s) => ({
      swapRequest: {
        id: ++swapSeq,
        from: s.swapRequest?.from ?? from,
        to,
        fast: s.swapRequest !== null,
      },
    })),
  clearSwap: (id) => set((s) => (s.swapRequest?.id === id ? { swapRequest: null } : {})),
  setIntroActive: (introActive) => set({ introActive }),
  resetUi: () => set({ drawerOpen: false, swapRequest: null }),
}));
