import type { Metadata } from "next";
import Link from "next/link";
import { BookMeta } from "@/components/home/book/BookMeta";
import { MissingNote, PageIllust, PageTitle, Spread } from "@/components/home/book/Spread";
import { StaffAvatar } from "@/components/home/StaffAvatar";
import { storySrc } from "@/lib/book/art";
import { buildStaffManifest } from "@/lib/book/manifest";
import { listStaff } from "@/services/homeContentService";

export const metadata: Metadata = { title: "요괴" };
export const dynamic = "force-dynamic";

export default async function StaffPage({ searchParams }: { searchParams: Promise<{ missing?: string }> }) {
  const { missing } = await searchParams;
  const staff = await listStaff(true);
  return (
    <>
      <BookMeta book="staff" pageKey="/staff" manifest={buildStaffManifest(staff)} />
      <Spread
        left={
          <>
            <PageTitle>나라카의 요괴들</PageTitle>
            <p className="leading-7">붙잡혀서 채용된 요괴들의 이력서 철이에요.</p>
            <PageIllust src={storySrc(17)} alt="옥자·미호·멜·바나 단체 사진" />
          </>
        }
        right={
          <div>
            {missing === "1" && <MissingNote>찾는 이력서가 없어서 명단을 펼쳤어요.</MissingNote>}
            <ul className="flex flex-col gap-2">
              {staff.map((s) => (
                <li key={s.id}>
                  <Link href={`/staff/${s.id}`} scroll={false} className="home-card flex min-h-11 items-center gap-3 px-3 py-2">
                    <StaffAvatar staff={s} size={32} />
                    <span className="font-medium">{s.name}</span>
                    {s.role && <span className="ml-auto text-xs text-[var(--home-red)]">{s.role}</span>}
                  </Link>
                </li>
              ))}
            </ul>
            {staff.length === 0 && (
              <p className="text-sm text-[var(--home-sheet-muted)]">요괴 소개는 곧 올릴게요.</p>
            )}
          </div>
        }
      />
    </>
  );
}
