// 게임 책 — 게임이 늘면 이 배열에 추가한다
export interface GameDef {
  id: string;
  title: string;
  summary: string;
  body: string[];
  href: string;
  hrefLabel: string;
}

export const GAMES: readonly GameDef[] = [
  {
    id: "stock",
    title: "나라카증권",
    summary: "가상 화폐로 요괴 도시의 주식을 사고파는 모의 투자",
    body: [
      "2026년 8월 한 달 동안 열린 첫 번째 게임입니다. 요괴 기업 주식을 가상 화폐로 거래하고, 마지막 날 총자산 순위로 상품을 드렸어요.",
      "참여 코드는 매장에서 드립니다.",
    ],
    href: "/event",
    hrefLabel: "나라카증권 들어가기",
  },
];
