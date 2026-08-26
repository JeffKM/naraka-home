import { DeskProp } from "@/components/home/DeskProp";
import type { Metadata } from "next";
import Link from "next/link";
import { listPosts } from "@/services/homeContentService";

export const metadata: Metadata = { title: "공지사항" };
export const dynamic = "force-dynamic";

export default async function NoticePage() {
  const posts = await listPosts({ type: "notice" });

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <div className="home-paper p-5 sm:p-8">
        {/* 공지 시트 위 모서리에 붙은 쪽지 조각 */}
        <DeskProp
          src="/home/deco/video/v-scrap.webp"
          width={140}
          height={117}
          className="-top-6 right-6 w-14 -rotate-6 sm:right-10 sm:w-20"
        />
    <h1 className="text-2xl font-bold">공지사항</h1>
    <ul className="mt-6 divide-y divide-[var(--home-line)]">
      {posts.map((p) => (
        <li key={p.id}>
          <Link href={`/notice/${p.id}`} className="flex items-baseline gap-2 py-3">
            <span className="truncate font-medium">
              {p.pinned ? "[고정] " : ""}
              {p.title}
            </span>
            <span className="ml-auto shrink-0 text-xs text-[var(--home-muted)]">
              {p.publishedAt.slice(0, 10)}
            </span>
          </Link>
        </li>
      ))}
      {posts.length === 0 && (
        <li className="py-6 text-sm text-[var(--home-muted)]">
          아직 붙은 공지가 없습니다.
        </li>
      )}
    </ul>
      </div>
    </main>
  );
}
