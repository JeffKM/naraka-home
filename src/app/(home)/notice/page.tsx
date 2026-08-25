import { HomeDeco } from "@/components/home/HomeDeco";
import Image from "next/image";
import type { Metadata } from "next";
import Link from "next/link";
import { listPosts } from "@/services/homeContentService";

export const metadata: Metadata = { title: "공지사항" };
export const dynamic = "force-dynamic";

export default async function NoticePage() {
  const posts = await listPosts({ type: "notice" });

  return (
    <>
      <HomeDeco />
      {/* 릴스 발췌 소품 — 페이지 포인트 */}
      <Image
        src="/home/deco/video/v-scrap.webp"
        alt=""
        aria-hidden
        width={90}
        height={76}
        className="pointer-events-none absolute left-[3vw] top-[330px] z-10 hidden select-none xl:block"
      />
      <main className="mx-auto max-w-3xl px-4 py-10">
        <div className="home-paper p-5 sm:p-8">
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
            등록된 공지가 없습니다.
          </li>
        )}
      </ul>
        </div>
      </main>
    </>
  );
}
