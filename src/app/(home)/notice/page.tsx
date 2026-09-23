import type { Metadata } from "next";
import Link from "next/link";
import { BookMeta } from "@/components/home/book/BookMeta";
import { MissingNote, PageIllust, PageTitle, Spread } from "@/components/home/book/Spread";
import { storySrc } from "@/lib/book/art";
import {
  LIST_PAGE_SIZE, buildNoticeManifest, clampPage, listPageCount, noticeListHref,
} from "@/lib/book/manifest";
import { pageKeyOfHref } from "@/lib/book/pageKey";
import { listPosts } from "@/services/homeContentService";

export const metadata: Metadata = { title: "공지사항" };
export const dynamic = "force-dynamic";

export default async function NoticePage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; missing?: string }>;
}) {
  const { page: rawPage, missing } = await searchParams;
  const posts = await listPosts({ type: "notice" });
  const total = listPageCount(posts.length);
  const page = clampPage(rawPage, total);
  const shown = posts.slice((page - 1) * LIST_PAGE_SIZE, page * LIST_PAGE_SIZE);

  return (
    <>
      <BookMeta book="notice" pageKey={pageKeyOfHref(noticeListHref(page))} manifest={buildNoticeManifest(posts)} />
      <Spread
        left={
          <>
            <PageTitle>공지</PageTitle>
            <p className="text-sm tabular-nums text-[var(--home-sheet-muted)]">
              목록 {page} / {total}
            </p>
            <PageIllust src={storySrc(5)} alt="밤하늘에 깜빡이는 나라카 간판과 박쥐" />
          </>
        }
        right={
          <div>
            {missing === "1" && <MissingNote>찾는 공지가 없어서 목록을 펼쳤어요.</MissingNote>}
            <ul className="flex flex-col gap-2">
              {shown.map((p) => (
                <li key={p.id}>
                  <Link href={`/notice/${p.id}`} scroll={false} className="home-card flex min-h-11 items-center gap-2 px-3 py-2">
                    {p.pinned && (
                      <span className="home-tag shrink-0 bg-[var(--home-chalk)] px-2 text-xs text-[var(--home-ink)]">고정</span>
                    )}
                    <span className="truncate font-medium">{p.title}</span>
                    <span className="ml-auto shrink-0 text-xs tabular-nums text-[var(--home-sheet-muted)]">
                      {p.publishedAt.slice(0, 10)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
            {posts.length === 0 && (
              <p className="text-sm text-[var(--home-sheet-muted)]">아직 붙은 공지가 없어요.</p>
            )}
          </div>
        }
      />
    </>
  );
}
