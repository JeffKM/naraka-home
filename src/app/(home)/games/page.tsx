import type { Metadata } from "next";
import Link from "next/link";
import { ArtPlate } from "@/components/home/book/ArtPlate";
import { BookMeta } from "@/components/home/book/BookMeta";
import { MissingNote, PageTitle, Spread } from "@/components/home/book/Spread";
import { GAMES } from "@/lib/book/games";
import { buildGamesManifest } from "@/lib/book/manifest";

export const metadata: Metadata = { title: "게임" };

export default async function GamesPage({ searchParams }: { searchParams: Promise<{ missing?: string }> }) {
  const { missing } = await searchParams;
  return (
    <>
      <BookMeta book="games" pageKey="/games" manifest={buildGamesManifest()} />
      <Spread
        left={
          <>
            <PageTitle>나라카 게임</PageTitle>
            <p className="leading-7">휴게실 탁자에 판이 벌어져 있어요.</p>
            <ArtPlate art="mahjong" className="book-illust" />
          </>
        }
        right={
          <div>
            {missing === "1" && <MissingNote>찾는 게임이 없어서 목차를 펼쳤어요.</MissingNote>}
            <ul className="flex flex-col gap-2">
              {GAMES.map((g) => (
                <li key={g.id}>
                  <Link href={`/games/${g.id}`} scroll={false} className="home-card block min-h-11 px-4 py-3">
                    <p className="font-semibold">{g.title}</p>
                    <p className="mt-1 text-sm text-[var(--home-sheet-muted)]">{g.summary}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        }
      />
    </>
  );
}
