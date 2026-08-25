import { HomeDeco } from "@/components/home/HomeDeco";
import Image from "next/image";
import type { Metadata } from "next";
import { listMenu } from "@/services/homeContentService";

export const metadata: Metadata = { title: "메뉴" };
export const dynamic = "force-dynamic";

export default async function MenuPage() {
  const items = await listMenu();
  const categories = [...new Set(items.map((i) => i.category))];

  return (
    <>
      <HomeDeco />
      {/* 릴스 발췌 소품 — 페이지 포인트 */}
      <Image
        src="/home/deco/video/v-jar.webp"
        alt=""
        aria-hidden
        width={84}
        height={147}
        className="pointer-events-none absolute left-[3vw] top-[330px] rotate-3 z-10 hidden select-none xl:block"
      />
      <main className="mx-auto max-w-3xl px-4 py-10">
        <div className="home-paper p-5 sm:p-8">
      <h1 className="text-2xl font-bold">메뉴</h1>
      {categories.length === 0 && (
        <p className="mt-6 text-sm text-[var(--home-muted)]">
          메뉴를 준비 중입니다. 인스타그램에서 미리 만나보세요.
        </p>
      )}
      {categories.map((cat) => (
        <section key={cat} className="mt-8">
          <h2 className="border-b border-[var(--home-line)] pb-2 text-lg font-semibold">
            {cat}
          </h2>
          <ul className="mt-3 flex flex-col gap-3">
            {items
              .filter((i) => i.category === cat)
              .map((i) => (
                <li key={i.id} className="flex items-start gap-3">
                  {i.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element -- Supabase Storage 공개 URL
                    <img
                      src={i.imageUrl}
                      alt={i.name}
                      className="size-16 rounded-md object-cover"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">
                      {i.name}
                      {i.isSoldOut && (
                        <span className="ml-2 text-xs text-[var(--home-red)]">
                          품절
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-[var(--home-muted)]">{i.description}</p>
                  </div>
                  <p className="shrink-0 tabular-nums">
                    {i.price.toLocaleString("ko-KR")}원
                  </p>
                </li>
              ))}
          </ul>
        </section>
      ))}
        </div>
      </main>
    </>
  );
}
