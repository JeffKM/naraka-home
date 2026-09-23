import Link from "next/link";
import { redirect } from "next/navigation";
import { BookMeta } from "@/components/home/book/BookMeta";
import { PageTitle, Spread } from "@/components/home/book/Spread";
import { PostBody } from "@/components/home/PostBody";
import { buildEventManifest, eventListHref, listPageOf, orderEvents } from "@/lib/book/manifest";
import { getKstParts } from "@/lib/market";
import { listPosts } from "@/services/homeContentService";

export const dynamic = "force-dynamic";

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ordered = orderEvents(await listPosts({ type: "event" }), getKstParts().date);
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
