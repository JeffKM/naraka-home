import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BookMeta } from "@/components/home/book/BookMeta";
import { PageTitle, Spread } from "@/components/home/book/Spread";
import { GAMES } from "@/lib/book/games";
import { buildGamesManifest } from "@/lib/book/manifest";

// 게임 목록은 코드 상수라 조회 비용이 없다
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const game = GAMES.find((g) => g.id === id);
  return { title: game ? `${game.title} — 게임` : "게임" };
}

export default async function GameDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const game = GAMES.find((g) => g.id === id);
  if (!game) redirect("/games?missing=1");

  return (
    <>
      <BookMeta book="games" pageKey={`/games/${game.id}`} manifest={buildGamesManifest()} />
      <Spread
        left={
          <>
            <PageTitle>{game.title}</PageTitle>
            <p className="leading-7">{game.summary}</p>
          </>
        }
        right={
          <div className="flex flex-col gap-4">
            {game.body.map((line) => (
              <p key={line} className="leading-7">{line}</p>
            ))}
            {/* 주식앱은 책 밖 — 일반 링크로 나간다 */}
            <Link href={game.href} className="home-btn home-btn-primary inline-flex min-h-11 w-fit items-center px-5">
              {game.hrefLabel}
            </Link>
          </div>
        }
      />
    </>
  );
}
