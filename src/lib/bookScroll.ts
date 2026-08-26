// 스크롤 위치 → 면별 접힘(fold)·열림(open) 진행도. 렌더 무관 순수 함수.

/** 면당 스크롤 길이 (뷰포트 높이 배수) */
export const BOOK_SCROLL_VH = 1;
/** 면 구간 끝에서 전환에 쓰는 비율 */
export const FOLD_ZONE = 0.3;

export interface BookScrollState {
  /** 현재 면 인덱스 */
  page: number;
  /** 면별 접힘 0(펼침)~1(옆으로 접힘) */
  fold: number[];
  /** 면별 열림 0(접힘)~1(판 전부 일어섬) */
  open: number[];
}

export function bookScrollState(scrollY: number, viewportH: number, pageCount: number): BookScrollState {
  const span = viewportH * BOOK_SCROLL_VH;
  const y = Math.max(0, scrollY);
  const page = Math.min(pageCount - 1, Math.floor(y / span));
  const t = page === pageCount - 1 && y >= (pageCount - 1) * span
    ? Math.min(1, (y - page * span) / span)
    : (y - page * span) / span;

  const fold = new Array<number>(pageCount).fill(0);
  const open = new Array<number>(pageCount).fill(0);
  for (let i = 0; i < page; i++) {
    fold[i] = 1;
    open[i] = 1;
  }
  open[page] = 1;

  const isLast = page === pageCount - 1;
  if (!isLast && t > 1 - FOLD_ZONE) {
    const k = (t - (1 - FOLD_ZONE)) / FOLD_ZONE;
    fold[page] = k;
    open[page + 1] = k;
  }
  return { page, fold, open };
}
