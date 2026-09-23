import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BookMeta } from "@/components/home/book/BookMeta";
import { MissingNote, PageIllust, PageTitle, Spread } from "@/components/home/book/Spread";
import { storySrc } from "@/lib/book/art";
import { buildMenuManifest } from "@/lib/book/manifest";
import { pageKeyOf } from "@/lib/book/pageKey";
import { listMenu } from "@/services/homeContentService";

export const metadata: Metadata = { title: "메뉴" };
export const dynamic = "force-dynamic";

export default async function MenuPage({
  searchParams,
}: {
  searchParams: Promise<{ c?: string; missing?: string }>;
}) {
  const { c, missing } = await searchParams;
  const items = await listMenu();
  const manifest = buildMenuManifest(items);
  const categories = [...new Set(items.map((i) => i.category))];

  if (c !== undefined && !categories.includes(c)) redirect("/menu?missing=1");

  if (c === undefined) {
    return (
      <>
        <BookMeta book="menu" pageKey={pageKeyOf("/menu", "")} manifest={manifest} />
        <Spread
          left={
            <>
              <PageTitle>메뉴</PageTitle>
              <p className="leading-7">주방요괴가 차리는 오늘의 메뉴판이에요.</p>
              <PageIllust src={storySrc(16)} alt="주방에서 설거지하는 미호" />
            </>
          }
          right={
            <div>
              {missing === "1" && <MissingNote>찾는 분류가 없어서 목차를 펼쳤어요.</MissingNote>}
              <ul className="flex flex-col gap-2">
                {categories.map((cat) => (
                  <li key={cat}>
                    <Link
                      href={`/menu?c=${encodeURIComponent(cat)}`}
                      scroll={false}
                      className="home-card flex min-h-11 items-center px-3 py-2"
                    >
                      <span className="font-medium">{cat}</span>
                      <span className="ml-auto text-sm tabular-nums text-[var(--home-sheet-muted)]">
                        {items.filter((i) => i.category === cat).length}가지
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
              {categories.length === 0 && (
                <p className="text-sm text-[var(--home-sheet-muted)]">
                  메뉴판을 짜는 중이에요. 인스타그램에 먼저 올라와요.
                </p>
              )}
            </div>
          }
        />
      </>
    );
  }

  const list = items.filter((i) => i.category === c);
  return (
    <>
      <BookMeta book="menu" pageKey={pageKeyOf("/menu", new URLSearchParams({ c }))} manifest={manifest} />
      <Spread
        left={
          <>
            <PageTitle>{c}</PageTitle>
            <p className="text-sm text-[var(--home-sheet-muted)]">{list.length}가지</p>
          </>
        }
        right={
          <ul className="flex flex-col gap-3">
            {list.map((i) => (
              <li key={i.id} className="flex items-start gap-3">
                {i.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element -- Supabase Storage 공개 URL
                  <img src={i.imageUrl} alt={i.name} className="size-16 rounded-md object-cover" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-medium">
                    {i.name}
                    {i.isSoldOut && <span className="ml-2 text-xs text-[var(--home-red)]">품절</span>}
                  </p>
                  <p className="text-sm text-[var(--home-sheet-muted)]">{i.description}</p>
                </div>
                <p className="shrink-0 tabular-nums">{i.price.toLocaleString("ko-KR")}원</p>
              </li>
            ))}
          </ul>
        }
      />
    </>
  );
}
