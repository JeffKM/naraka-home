import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { cache } from "react";
import { BookMeta } from "@/components/home/book/BookMeta";
import { PageTitle, Spread } from "@/components/home/book/Spread";
import { PostBody } from "@/components/home/PostBody";
import { buildEventManifest, eventListHref, listPageOf, orderEvents } from "@/lib/book/manifest";
import { getKstParts } from "@/lib/market";
import { listPosts } from "@/services/homeContentService";

export const dynamic = "force-dynamic";

// 탭 제목(generateMetadata)과 본문이 같은 요청 안에서 목록을 한 번만 읽게
const getEvents = cache(() => listPosts({ type: "event" }));

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  // 조회가 실패해도 제목 때문에 쪽 전체가 깨지지 않게 — 목록 제목으로 두고 본문 쪽(error.tsx)이 오류를 알린다
  try {
    const post = (await getEvents()).find((p) => String(p.id) === id);
    // 없는 이벤트는 본문이 목록으로 돌려보낸다 — 제목은 목록 것을 쓴다
    return { title: post ? `${post.title} — 이벤트` : "이벤트" };
  } catch (e) {
    console.error("[events/[id]] 탭 제목 조회 실패", e);
    return { title: "이벤트" };
  }
}

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ordered = orderEvents(await getEvents(), getKstParts().date);
  const index = ordered.findIndex((p) => String(p.id) === id);
  if (index === -1) redirect("/events?missing=1");
  const post = ordered[index];

  return (
    <>
      <BookMeta book="events" pageKey={`/events/${post.id}`} manifest={buildEventManifest(ordered)} />
      <Spread
        left={
          <>
            <p className="text-xs tabular-nums text-[var(--home-red)]">
              {post.eventStartDate}
              {post.eventEndDate ? ` ~ ${post.eventEndDate}` : ""}
            </p>
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
              href={eventListHref(listPageOf(index))}
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
