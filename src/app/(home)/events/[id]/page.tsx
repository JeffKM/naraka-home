import { DeskProp } from "@/components/home/DeskProp";
import { notFound } from "next/navigation";
import { PostBody } from "@/components/home/PostBody";
import { getPost } from "@/services/homeContentService";

export const dynamic = "force-dynamic";

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const numId = Number(id);
  if (!Number.isInteger(numId) || numId <= 0) notFound();
  const post = await getPost(numId);
  if (!post || post.type !== "event") notFound();

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <div className="home-paper p-5 sm:p-8">
        {/* 이벤트 상품 자루 */}
        <DeskProp
          src="/home/deco/deco-moneybag.webp"
          width={218}
          height={300}
          className="-bottom-5 right-6 w-12 sm:right-10 sm:w-16"
        />
    <p className="text-xs text-[var(--home-red)]">
      {post.eventStartDate}
      {post.eventEndDate ? ` ~ ${post.eventEndDate}` : ""}
    </p>
    <h1 className="mt-1 text-2xl font-bold">{post.title}</h1>
    {post.coverImageUrl && (
      // eslint-disable-next-line @next/next/no-img-element -- Supabase Storage 공개 URL
      <img
        src={post.coverImageUrl}
        alt=""
        className="mt-4 w-full rounded-lg object-cover"
      />
    )}
    <PostBody markdown={post.bodyMd} />
      </div>
    </main>
  );
}
