// 어드민 홈 콘텐츠 [id] 라우트 공통 파서 — 정수가 아닌 id(예: "abc")로 인한 500 방지.
export function parseId(raw: string): number | null {
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : null;
}
