import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { cache } from "react";
import { BookMeta } from "@/components/home/book/BookMeta";
import { PageTitle, Spread } from "@/components/home/book/Spread";
import { PostBody } from "@/components/home/PostBody";
import { buildNoticeManifest, listPageOf, noticeListHref } from "@/lib/book/manifest";
import { listPosts } from "@/services/homeContentService";

export const dynamic = "force-dynamic";

// 탭 제목(generateMetadata)과 본문이 같은 요청 안에서 목록을 한 번만 읽게
const getNotices = cache(() => listPosts({ type: "notice" }));

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const post = (await getNotices()).find((p) => String(p.id) === id);
  // 없는 글은 본문이 목록으로 돌려보낸다 — 제목은 목록 것을 쓴다
  return { title: post ? `${post.title} — 공지사항` : "공지사항" };
}

export default async function NoticeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const posts = await getNotices();
  const index = posts.findIndex((p) => String(p.id) === id);
  if (index === -1) redirect("/notice?missing=1");
  const post = posts[index];

  return (
    <>
      <BookMeta book="notice" pageKey={`/notice/${post.id}`} manifest={buildNoticeManifest(posts)} />
      <Spread
        left={
          <>
            <p className="text-xs tabular-nums text-[var(--home-sheet-muted)]">{post.publishedAt.slice(0, 10)}</p>
            <PageTitle>{post.title}</PageTitle>
            {post.coverImageUrl && (
              // eslint-disable-next-line @next/next/no-img-element -- Supabase Storage 공개 URL
              <img src={post.coverImageUrl} alt="" className="book-illust object-cover" />
            )}
          </>
        }
        right={
          <div className="flex flex-col gap-4">
            <PostBody markdown={post.bodyMd} />
            <Link
              href={noticeListHref(listPageOf(index))}
              scroll={false}
              className="home-btn inline-flex min-h-11 w-fit items-center px-4 text-sm"
            >
              목록으로
            </Link>
          </div>
        }
      />
    </>
  );
}
