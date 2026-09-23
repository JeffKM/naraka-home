import type { Metadata } from "next";
import Link from "next/link";
import { BookMeta } from "@/components/home/book/BookMeta";
import { MissingNote, PageIllust, PageTitle, Spread } from "@/components/home/book/Spread";
import { CalendarSpread } from "@/components/home/spreads/CalendarSpread";
import { storySrc } from "@/lib/book/art";
import {
  LIST_PAGE_SIZE, buildEventManifest, clampPage, eventListHref, eventPhase, listPageCount, orderEvents,
  type EventPhase,
} from "@/lib/book/manifest";
import { pageKeyOfHref } from "@/lib/book/pageKey";
import { getKstParts } from "@/lib/market";
import { listPosts } from "@/services/homeContentService";

export const metadata: Metadata = { title: "이벤트" };
export const dynamic = "force-dynamic";

const PHASE_LABEL: Record<EventPhase, string> = { ongoing: "진행 중", upcoming: "예정", past: "지난" };

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; month?: string; missing?: string }>;
}) {
  const { page: rawPage, month, missing } = await searchParams;
  const today = getKstParts().date;
  const ordered = orderEvents(await listPosts({ type: "event" }), today);
  const manifest = buildEventManifest(ordered);

  // 첫 쪽 = 달력 (온라인 이벤트 안내용)
  if (rawPage === undefined) {
    return (
      <>
        <BookMeta book="events" pageKey="/events" manifest={manifest} />
        {missing === "1" ? (
          <Spread
            left={<PageTitle>이벤트</PageTitle>}
            right={
              <div className="flex flex-col gap-3">
                <MissingNote>찾는 이벤트가 없어요.</MissingNote>
                <Link href={eventListHref(1)} scroll={false} className="home-btn inline-flex min-h-11 w-fit items-center px-4 text-sm">
                  이벤트 목록 펼치기
                </Link>
              </div>
            }
          />
        ) : (
          <CalendarSpread
            rawMonth={month}
            monthHrefBase="/events?month="
            title="이달의 이벤트"
            lead="날짜를 누르면 그날의 이벤트가 보여요. 다음 장을 넘기면 이벤트 목록이에요."
          />
        )}
      </>
    );
  }

  const total = listPageCount(ordered.length);
  const page = clampPage(rawPage, total);
  const shown = ordered.slice((page - 1) * LIST_PAGE_SIZE, page * LIST_PAGE_SIZE);

  return (
    <>
      <BookMeta book="events" pageKey={pageKeyOfHref(eventListHref(page))} manifest={manifest} />
      <Spread
        left={
          <>
            <PageTitle>이벤트 목록</PageTitle>
            <p className="text-sm tabular-nums text-[var(--home-sheet-muted)]">목록 {page} / {total}</p>
            <PageIllust src={storySrc(9)} alt="노래하며 빙글 도는 미호" />
          </>
        }
        right={
          <div>
            <ul className="flex flex-col gap-2">
              {shown.map((p) => {
                const phase = eventPhase(p, today);
                return (
                  <li key={p.id}>
                    <Link href={`/events/${p.id}`} scroll={false} className="home-card flex min-h-11 items-center gap-2 px-3 py-2">
                      <span
                        className={[
                          "home-tag shrink-0 px-2 text-xs",
                          phase === "ongoing"
                            ? "bg-[var(--home-red)] text-[var(--home-on-red)]"
                            : "bg-[var(--home-chalk)] text-[var(--home-ink)]",
                        ].join(" ")}
                      >
                        {PHASE_LABEL[phase]}
                      </span>
                      <span className="truncate font-medium">{p.title}</span>
                      <span className="ml-auto shrink-0 text-xs tabular-nums text-[var(--home-sheet-muted)]">
                        {p.eventStartDate}
                        {p.eventEndDate ? ` ~ ${p.eventEndDate}` : ""}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
            {ordered.length === 0 && (
              <p className="text-sm text-[var(--home-sheet-muted)]">지금 열린 이벤트가 없어요.</p>
            )}
          </div>
        }
      />
    </>
  );
}
