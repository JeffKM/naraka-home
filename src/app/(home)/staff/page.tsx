import { HomeDeco } from "@/components/home/HomeDeco";
import Image from "next/image";
import type { Metadata } from "next";
import { listStaff } from "@/services/homeContentService";

export const metadata: Metadata = { title: "스태프" };
export const dynamic = "force-dynamic";

export default async function StaffPage() {
  const staff = await listStaff(true);

  return (
    <>
      <HomeDeco />
      {/* 릴스 발췌 소품 — 페이지 포인트 */}
      <Image
        src="/home/deco/video/v-quill-ink.webp"
        alt=""
        aria-hidden
        width={74}
        height={180}
        className="pointer-events-none absolute left-[3vw] top-[320px] z-10 hidden select-none xl:block"
      />
      <main className="mx-auto max-w-3xl px-4 py-10">
        <div className="home-paper p-5 sm:p-8">
      <h1 className="text-2xl font-bold">나라카의 요괴들</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {staff.map((s) => (
          <div
            key={s.id}
            className="overflow-hidden rounded-lg border border-[var(--home-line)] bg-[var(--home-surface)]"
          >
            {s.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- Supabase Storage 공개 URL
              <img
                src={s.photoUrl}
                alt={s.name}
                className="aspect-square w-full object-cover"
              />
            ) : (
              <div className="flex aspect-square w-full items-center justify-center bg-[var(--home-line)] text-sm text-[var(--home-muted)]">
                사진 준비 중
              </div>
            )}
            <div className="p-4">
              <p className="font-semibold">{s.name}</p>
              {s.role && (
                <p className="text-xs text-[var(--home-red)]">{s.role}</p>
              )}
              <p className="mt-2 text-sm text-[var(--home-muted)]">{s.intro}</p>
            </div>
          </div>
        ))}
        {staff.length === 0 && (
          <p className="text-sm text-[var(--home-muted)]">
            스태프 소개를 준비 중입니다.
          </p>
        )}
      </div>
        </div>
      </main>
    </>
  );
}
