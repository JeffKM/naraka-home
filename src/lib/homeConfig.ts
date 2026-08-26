// 카페 홈 공통 정보 — 사장님 확인값으로 교체할 수 있는 단일 지점
export const HOME_INFO = {
  name: "나라카",
  tagline: "요괴들의 도시, 나라카에 오신 것을 환영합니다",
  addressLine: "대구 중구 동성로", // 상세 주소는 사장님 제공 시 교체
  hoursNote: "영업시간과 휴무일은 인스타그램 공지를 확인해주세요",
  instagramHandle: "naraka_concafe",
  instagramUrl: "https://instagram.com/naraka_concafe",
  // 예약은 외부 채널로 — 자체 예약 시스템 없음 (스펙 §7)
  reserveUrl: "https://instagram.com/naraka_concafe",
} as const;
