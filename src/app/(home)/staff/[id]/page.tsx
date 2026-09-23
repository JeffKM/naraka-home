import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BookMeta } from "@/components/home/book/BookMeta";
import { PageTitle, Spread } from "@/components/home/book/Spread";
import { buildStaffManifest } from "@/lib/book/manifest";
import { listStaff } from "@/services/homeContentService";

export const metadata: Metadata = { title: "요괴 이력서" };
export const dynamic = "force-dynamic";

// 요괴 한 명 = 이력서 한 장
export default async function StaffDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const staff = await listStaff(true);
  const s = staff.find((x) => String(x.id) === id);
  if (!s) redirect("/staff?missing=1");

  return (
    <>
      <BookMeta book="staff" pageKey={`/staff/${s.id}`} manifest={buildStaffManifest(staff)} />
      <Spread
        left={
          <>
            <p className="home-ui text-sm text-[var(--home-sheet-muted)]">이력서</p>
            <PageTitle>{s.name}</PageTitle>
            {s.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- Supabase Storage 공개 URL
              <img src={s.photoUrl} alt={s.name} className="book-illust aspect-[3/4] object-cover" />
            ) : (
              <div className="book-illust flex aspect-[3/4] items-center justify-center bg-[var(--home-cream)] text-sm text-[var(--home-sheet-muted)]">
                사진 준비 중
              </div>
            )}
          </>
        }
        right={
          <div className="flex flex-col gap-4">
            <dl className="home-card divide-y divide-[var(--home-line)]">
              <div className="flex gap-3 px-4 py-3">
                <dt className="w-16 shrink-0 font-semibold">이름</dt>
                <dd>{s.name}</dd>
              </div>
              {s.role && (
                <div className="flex gap-3 px-4 py-3">
                  <dt className="w-16 shrink-0 font-semibold">직책</dt>
                  <dd>{s.role}</dd>
                </div>
              )}
              <div className="flex gap-3 px-4 py-3">
                <dt className="w-16 shrink-0 font-semibold">자기소개</dt>
                <dd className="whitespace-pre-line">{s.intro || "곧 적을게요."}</dd>
              </div>
            </dl>
            <p aria-label="채용 결과: 종신">
              <span className="book-stamp home-serif" aria-hidden>종신</span>
            </p>
            <Link href="/staff" scroll={false} className="home-btn inline-flex min-h-11 w-fit items-center px-4 text-sm">
              명단으로
            </Link>
          </div>
        }
      />
    </>
  );
}
