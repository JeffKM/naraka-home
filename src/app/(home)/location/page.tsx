import type { Metadata } from "next";
import { ArtPlate } from "@/components/home/book/ArtPlate";
import { BookMeta } from "@/components/home/book/BookMeta";
import { PageIllust, PageTitle, Spread } from "@/components/home/book/Spread";
import { storySrc } from "@/lib/book/art";
import { LOCATION_MANIFEST } from "@/lib/book/manifest";
import { pageKeyOf } from "@/lib/book/pageKey";
import { HOME_INFO } from "@/lib/homeConfig";

export const metadata: Metadata = { title: "오시는 길" };

export default async function LocationPage({ searchParams }: { searchParams: Promise<{ p?: string }> }) {
  const { p } = await searchParams;
  const page = p === "hours" || p === "reserve" ? p : null;
  const meta = (
    <BookMeta book="location" pageKey={pageKeyOf("/location", page ? `p=${page}` : "")} manifest={LOCATION_MANIFEST} />
  );

  if (page === "hours") {
    return (
      <>
        {meta}
        <Spread
          left={
            <>
              <PageTitle>영업시간</PageTitle>
              <p className="leading-7">마녀가 자는 시간에는 문을 닫아요.</p>
              <PageIllust src={storySrc(6)} alt="잠든 옥자와 고양이들" />
            </>
          }
          right={
            <div className="flex flex-col gap-4">
              <p className="leading-7">{HOME_INFO.hoursNote}</p>
              <a
                href={HOME_INFO.instagramUrl}
                target="_blank"
                rel="noreferrer"
                className="home-btn inline-flex min-h-11 w-fit items-center px-4"
              >
                instagram @{HOME_INFO.instagramHandle}
                <span className="sr-only"> (새 창)</span>
              </a>
            </div>
          }
        />
      </>
    );
  }

  if (page === "reserve") {
    return (
      <>
        {meta}
        <Spread
          left={
            <>
              <PageTitle>예약</PageTitle>
              <p className="leading-7">예약과 문의는 인스타그램 메시지로 받아요.</p>
            </>
          }
          right={
            <div className="flex flex-col gap-4">
              <a
                href={HOME_INFO.reserveUrl}
                target="_blank"
                rel="noreferrer"
                className="home-btn home-btn-primary inline-flex min-h-11 w-fit items-center px-5"
              >
                인스타그램으로 예약·문의하기
                <span className="sr-only"> (새 창)</span>
              </a>
              <p className="text-sm text-[var(--home-sheet-muted)]">
                {HOME_INFO.name} · {HOME_INFO.addressLine}
              </p>
            </div>
          }
        />
      </>
    );
  }

  return (
    <>
      {meta}
      <Spread
        left={
          <>
            <PageTitle>오시는 길</PageTitle>
            <ArtPlate art="map" className="book-illust" />
          </>
        }
        right={
          <dl className="flex flex-col gap-4">
            <div>
              <dt className="font-semibold">주소</dt>
              <dd className="mt-1 text-[var(--home-sheet-muted)]">{HOME_INFO.addressLine}</dd>
            </div>
            <p className="text-sm text-[var(--home-sheet-muted)]">
              정확한 위치는 인스타그램 프로필에 있어요. 지도 그림은 분위기용이에요.
            </p>
          </dl>
        }
      />
    </>
  );
}
