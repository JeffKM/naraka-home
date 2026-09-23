import { HomeDeco } from "@/components/home/HomeDeco";
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
    <>
      <HomeDeco />
      <main className="mx-auto max-w-3xl px-4 py-10">
        <div className="home-paper p-5 sm:p-8">
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
    </>
  );
}
