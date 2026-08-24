import type { Metadata } from "next";
import Link from "next/link";
import { listPosts } from "@/services/homeContentService";

export const metadata: Metadata = { title: "이벤트" };
export const dynamic = "force-dynamic";

export default async function EventsPage() {
  const posts = await listPosts({ type: "event" });

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-bold">이벤트</h1>

      {/* 나라카증권 상설 카드 — /event 주식앱 진입점 */}
      <Link
        href="/event"
        className="mt-6 block rounded-lg border-2 border-[var(--home-burgundy)] bg-[var(--home-surface)] p-5"
      >
        <p className="text-xs font-semibold text-[var(--home-burgundy)]">상설</p>
        <p className="mt-1 text-lg font-bold">나라카증권 — 모의 주식 거래</p>
        <p className="mt-1 text-sm text-[var(--home-muted)]">
          가상 화폐로 요괴 도시의 주식을 거래해보세요. 매장 방문 코드로 참여할 수
          있습니다.
        </p>
      </Link>

      <ul className="mt-6 flex flex-col gap-3">
        {posts.map((p) => (
          <li key={p.id}>
            <Link
              href={`/events/${p.id}`}
              className="block rounded-lg border border-[var(--home-line)] bg-[var(--home-surface)] p-4"
            >
              <p className="font-semibold">
                {p.pinned ? "[고정] " : ""}
                {p.title}
              </p>
              <p className="mt-1 text-xs text-[var(--home-muted)]">
                {p.eventStartDate}
                {p.eventEndDate ? ` ~ ${p.eventEndDate}` : ""}
              </p>
            </Link>
          </li>
        ))}
        {posts.length === 0 && (
          <li className="text-sm text-[var(--home-muted)]">
            진행 중인 이벤트가 없습니다.
          </li>
        )}
      </ul>
    </main>
  );
}
