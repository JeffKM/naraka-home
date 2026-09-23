import Link from "next/link";
import { ArtPlate } from "@/components/home/book/ArtPlate";
import { PageIllust, PageTitle, Spread } from "@/components/home/book/Spread";
import { StaffAvatar } from "@/components/home/StaffAvatar";
import { storySrc } from "@/lib/book/art";
import { eventPhase } from "@/lib/book/manifest";
import { formatMinute } from "@/lib/homeCalendar";
import { HOME_INFO } from "@/lib/homeConfig";
import { getKstParts } from "@/lib/market";
import {
  getMonthEvents,
  listPosts,
  listScheduleRange,
  listStaff,
} from "@/services/homeContentService";

// 홈 책 1쪽 — 오늘 출근한 요괴 + 지금 열린 이벤트
export async function TodaySpread() {
  const today = getKstParts().date;
  const [events, schedule, staff] = await Promise.all([
    getMonthEvents(today.slice(0, 7)),
    listScheduleRange(today, today),
    listStaff(true),
  ]);
  const ongoing = events.filter((e) => eventPhase(e, today) === "ongoing");
  const staffById = new Map(staff.map((s) => [s.id, s]));

  return (
    <Spread
      left={
        <>
          <p className="home-ui text-sm tabular-nums text-[var(--home-sheet-muted)]">
            {today.replaceAll("-", ".")}
          </p>
          <PageTitle>오늘의 나라카</PageTitle>
          <p className="leading-7">{HOME_INFO.tagline}</p>
          <PageIllust src={storySrc(13)} alt="책상에서 이력서를 심사하는 옥자" />
        </>
      }
      right={
        <div className="flex flex-col gap-6">
          <section>
            <h2 className="home-plate text-lg font-semibold">오늘 출근한 요괴</h2>
            <ul className="mt-3 flex flex-col gap-2">
              {schedule.map((e) => {
                const s = staffById.get(e.staffId);
                if (!s) return null;
                return (
                  <li key={e.id}>
                    <Link
                      href={`/staff/${s.id}`}
                      scroll={false}
                      className="home-card flex min-h-11 items-center gap-2 px-3 py-2"
                    >
                      <StaffAvatar staff={s} />
                      <span className="font-medium">{s.name}</span>
                      <span className="ml-auto text-sm tabular-nums text-[var(--home-sheet-muted)]">
                        {formatMinute(e.startMin)} ~ {formatMinute(e.endMin)}
                      </span>
                    </Link>
                  </li>
                );
              })}
              {schedule.length === 0 && (
                <li className="text-sm text-[var(--home-sheet-muted)]">
                  오늘 출근표는 아직 안 나왔어요.
                </li>
              )}
            </ul>
          </section>
          <section>
            <h2 className="home-plate text-lg font-semibold">지금 열린 이벤트</h2>
            <ul className="mt-3 flex flex-col gap-2">
              {ongoing.map((e) => (
                <li key={e.id}>
                  <Link
                    href={`/events/${e.id}`}
                    scroll={false}
                    className="home-card flex min-h-11 items-center gap-2 px-3 py-2"
                  >
                    <span className="truncate">{e.title}</span>
                    <span className="ml-auto shrink-0 text-xs tabular-nums text-[var(--home-sheet-muted)]">
                      ~ {e.eventEndDate ?? e.eventStartDate}
                    </span>
                  </Link>
                </li>
              ))}
              {ongoing.length === 0 && (
                <li className="text-sm text-[var(--home-sheet-muted)]">지금 열린 이벤트가 없어요.</li>
              )}
            </ul>
          </section>
        </div>
      }
    />
  );
}

// 홈 책 3쪽 — 공지·이벤트 최신 8개
export async function NewsSpread() {
  const latest = await listPosts({ limit: 8 });
  return (
    <Spread
      left={
        <>
          <PageTitle>새 소식</PageTitle>
          <p className="leading-7">공지와 이벤트를 새로 붙은 순서로 모았어요.</p>
          <PageIllust src={storySrc(5)} alt="밤하늘에 깜빡이는 나라카 간판과 박쥐" />
        </>
      }
      right={
        <div className="flex flex-col gap-4">
          <ul className="flex flex-col gap-2">
            {latest.map((p) => (
              <li key={p.id}>
                <Link
                  href={p.type === "event" ? `/events/${p.id}` : `/notice/${p.id}`}
                  scroll={false}
                  className="home-card flex min-h-11 items-center gap-2 px-3 py-2"
                >
                  <span
                    className={[
                      "home-tag shrink-0 px-2 text-xs",
                      p.type === "event"
                        ? "bg-[var(--home-red)] text-[var(--home-on-red)]"
                        : "bg-[var(--home-chalk)] text-[var(--home-ink)]",
                    ].join(" ")}
                  >
                    {p.type === "event" ? "이벤트" : "공지"}
                  </span>
                  <span className="truncate">{p.title}</span>
                  <span className="ml-auto shrink-0 text-xs tabular-nums text-[var(--home-sheet-muted)]">
                    {p.publishedAt.slice(0, 10)}
                  </span>
                </Link>
              </li>
            ))}
            {latest.length === 0 && (
              <li className="text-sm text-[var(--home-sheet-muted)]">아직 전할 소식이 없어요.</li>
            )}
          </ul>
          <div className="flex gap-3">
            <Link href="/notice" scroll={false} className="home-btn inline-flex min-h-11 items-center px-4 text-sm">
              공지 책 펼치기
            </Link>
            <Link href="/events" scroll={false} className="home-btn inline-flex min-h-11 items-center px-4 text-sm">
              이벤트 책 펼치기
            </Link>
          </div>
        </div>
      }
    />
  );
}

// 홈 책 4쪽 — 방문 안내 요약
export function VisitSpread() {
  return (
    <Spread
      left={
        <>
          <PageTitle>방문 안내</PageTitle>
          <ArtPlate art="map" className="book-illust" />
        </>
      }
      right={
        <dl className="flex flex-col gap-4">
          <div>
            <dt className="font-semibold">주소</dt>
            <dd className="mt-1 text-[var(--home-sheet-muted)]">{HOME_INFO.addressLine}</dd>
          </div>
          <div>
            <dt className="font-semibold">영업시간</dt>
            <dd className="mt-1 text-[var(--home-sheet-muted)]">{HOME_INFO.hoursNote}</dd>
          </div>
          <div className="flex flex-wrap gap-3">
            <a
              href={HOME_INFO.reserveUrl}
              target="_blank"
              rel="noreferrer"
              className="home-btn home-btn-primary inline-flex min-h-11 items-center px-5"
            >
              예약하기
            </a>
            <Link href="/location" scroll={false} className="home-btn inline-flex min-h-11 items-center px-4">
              오시는 길 책 펼치기
            </Link>
          </div>
        </dl>
      }
    />
  );
}
