// 인트로 재생 조건 — 스펙 §4-1
export type IntroMode = "full" | "short" | "none";

export const INTRO_VISITED_KEY = "naraka-intro-seen";

export interface IntroInput {
  pathname: string;
  search: string;
  visited: boolean | null; // null = sessionStorage 접근 불가 → 재진입 취급
  reducedMotion: boolean;
}

// 홈 책의 첫 쪽인가 (month 같은 쪽 안 쿼리는 무시, ?p= 가 있으면 다른 쪽)
export function isHomeRoot(pathname: string, search: string): boolean {
  if (pathname !== "/") return false;
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  return !params.has("p");
}

export function introMode(input: IntroInput): IntroMode {
  if (input.reducedMotion) return "none";
  if (!isHomeRoot(input.pathname, input.search)) return "none";
  return input.visited === false ? "full" : "short";
}
