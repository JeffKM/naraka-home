import { HomeDeco } from "@/components/home/HomeDeco";
import Image from "next/image";
import type { Metadata } from "next";
import Link from "next/link";
import { listPosts } from "@/services/homeContentService";

export const metadata: Metadata = { title: "이벤트" };
export const dynamic = "force-dynamic";

export default async function EventsPage() {
  const posts = await listPosts({ type: "event" });

  return (
    <>
      <HomeDeco />
      {/* 릴스 발췌 소품 — 페이지 포인트 */}
      <Image
        src="/home/deco/video/v-stamp-tool.webp"
        alt=""
        aria-hidden
        width={80}
        height={113}
        className="pointer-events-none absolute left-[3vw] top-[330px] -rotate-6 z-10 hidden select-none xl:block"
      />
      <main className="mx-auto max-w-3xl px-4 py-10">
        <div className="home-paper p-5 sm:p-8">
      <h1 className="text-2xl font-bold">이벤트</h1>

      {/* 나라카증권 상설 카드 — /event 주식앱 진입점 */}
      <Link href="/event" className="home-card relative mt-8 block p-5">
        <span className="home-tag absolute -top-3 left-4 bg-[var(--home-red)] px-2 text-xs text-[var(--home-surface)]">
          상설
        </span>
        <p className="home-ui mt-1 text-lg">나라카증권 — 모의 주식 거래</p>
        <p className="mt-1 text-sm text-[var(--home-muted)]">
          가상 화폐로 요괴 도시의 주식을 거래해보세요. 매장 방문 코드로 참여할 수
          있습니다.
        </p>
        <div className="home-rule mt-3" aria-hidden />
      </Link>

      <ul className="mt-8 flex flex-col gap-5">
        {posts.map((p) => (
          <li key={p.id}>
            <Link href={`/events/${p.id}`} className="home-card relative block p-4">
              {p.pinned && (
                <span className="home-tag absolute -top-3 left-4 bg-[var(--home-chalk)] px-2 text-xs text-[var(--home-ink)]">
                  고정
                </span>
              )}
              <p className="font-semibold">{p.title}</p>
              <p className="mt-1 text-xs tabular-nums text-[var(--home-muted)]">
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
        </div>
      </main>
    </>
  );
}
