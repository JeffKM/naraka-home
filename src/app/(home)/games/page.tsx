import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "게임" };

// 웹게임 허브 — 게임이 준비되면 이 배열에 추가한다
const GAMES: { href: string; title: string; desc: string }[] = [];

export default function GamesPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-bold">나라카 게임</h1>
      {GAMES.length === 0 ? (
        <div className="mt-10 rounded-[14px] border-2 border-dashed border-[var(--home-muted)] p-10 text-center text-[var(--home-muted)]">
          <p className="home-ui text-base text-[var(--home-ink)]">준비 중입니다</p>
          <p className="mt-2 text-sm">
            요괴들이 새 게임을 만들고 있어요. 지금은{" "}
            <Link href="/events" className="underline underline-offset-2">
              이벤트 탭
            </Link>
            에서 나라카증권을 즐겨주세요.
          </p>
        </div>
      ) : (
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {GAMES.map((g) => (
            <Link
              key={g.href}
              href={g.href}
              className="rounded-lg border border-[var(--home-line)] bg-[var(--home-surface)] p-4"
            >
              <p className="font-semibold">{g.title}</p>
              <p className="mt-1 text-sm text-[var(--home-muted)]">{g.desc}</p>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
