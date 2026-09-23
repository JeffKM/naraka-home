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
  register: (page: CurrentPage) => void;
  setDrawerOpen: (open: boolean) => void;
  requestSwap: (from: BookId, to: BookId) => void;
  clearSwap: (id: number) => void;
}

let swapSeq = 0;

export const useBookStore = create<BookState>()((set) => ({
  current: null,
  drawerOpen: false,
  swapRequest: null,
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
}));
