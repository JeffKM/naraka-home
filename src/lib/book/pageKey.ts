// 쪽을 가르는 쿼리만 남긴 정규 키. month 같은 쪽 안 상태·missing 안내 플래그는 버린다
const PAGE_PARAMS = ["p", "c", "page"] as const;

export function pageKeyOf(pathname: string, search: string | URLSearchParams): string {
  const params =
    typeof search === "string"
      ? new URLSearchParams(search.startsWith("?") ? search.slice(1) : search)
      : search;
  const kept = new URLSearchParams();
  for (const name of PAGE_PARAMS) {
    const value = params.get(name);
    if (value !== null && value !== "") kept.set(name, value);
  }
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  const query = kept.toString();
  return query ? `${path}?${query}` : path;
}

export function pageKeyOfHref(href: string): string {
  const url = new URL(href, "http://book.local");
  return pageKeyOf(url.pathname, url.search);
}
