import type { BookId } from "@/lib/book/books";

// 시험판 쪽 내용 — 책마다 원화 한 장·짧은 글 (입체 시험판 두 가지가 같이 쓴다)
export const PAGE: Record<BookId, { story: number; line: string }> = {
  home: { story: 13, line: "사고 치다 붙잡힌 요괴들이 일하는 동성로의 작은 지옥." },
  about: { story: 1, line: "옥자님의 채용 공고는 늘 한 줄. 종신 계약." },
  location: { story: 5, line: "동성로 골목 끝, 파란 불꽃이 새어 나오는 문." },
  menu: { story: 12, line: "주방요괴가 차리는 오늘의 메뉴판." },
  staff: { story: 3, line: "오늘 출근한 요괴들을 확인하세요." },
  notice: { story: 9, line: "옥자님이 붙인 공지가 여기 모입니다." },
  events: { story: 15, line: "이번 달 지옥에서 열리는 일들." },
  games: { story: 17, line: "마작 한 판, 지는 쪽이 설거지." },
};

export const PAGE_NOTE = "시험판 쪽입니다. 실제 내용은 기존 쪽이 그대로 들어갑니다.";
