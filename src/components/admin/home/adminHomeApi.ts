"use client";

import type { ApiResponse } from "@/types/api";

// 어드민 홈 API 공용 fetch — 실패 시 에러 메시지를 throw해 각 섹션이 toast로 표시
export async function adminHomeFetch<T>(
  url: string,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: init?.body instanceof FormData
      ? init?.headers
      : { "Content-Type": "application/json", ...init?.headers },
  });
  const json = (await res.json()) as ApiResponse<T>;
  if (!json.success) throw new Error(json.error.message);
  return json.data;
}
