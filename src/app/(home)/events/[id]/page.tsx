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
  const post = await getPost(Number(id));
  if (!post || post.type !== "event") notFound();

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <p className="text-xs text-[var(--home-burgundy)]">
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
    </main>
  );
}
