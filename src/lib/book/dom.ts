import type { ScrollBox } from "./input";

// 이벤트 대상에서 위로 올라가며 실제로 스크롤되는 data-book-scroll 칸을 찾는다
// (데스크톱 왼쪽 면·데스크톱 book-spread-body는 overflow가 hidden이라 건너뛴다)
export function findScrollBox(target: EventTarget | null, root: HTMLElement): ScrollBox | null {
  let el: Element | null = target instanceof Element ? target : null;
  while (el && el !== root) {
    if (el instanceof HTMLElement && el.dataset.bookScroll !== undefined) {
      const overflowY = getComputedStyle(el).overflowY;
      if (overflowY === "auto" || overflowY === "scroll") {
        return { scrollTop: el.scrollTop, scrollHeight: el.scrollHeight, clientHeight: el.clientHeight };
      }
    }
    el = el.parentElement;
  }
  return null;
}

// 쪽 안 스크롤 칸들의 현재 위치 (문서 순서)
export function readScrollTops(root: HTMLElement): number[] {
  return Array.from(root.querySelectorAll<HTMLElement>("[data-book-scroll]")).map((el) => el.scrollTop);
}

export function applyScrollTops(root: HTMLElement, tops: readonly number[]): void {
  root.querySelectorAll<HTMLElement>("[data-book-scroll]").forEach((el, i) => {
    el.scrollTop = tops[i] ?? 0;
  });
}
