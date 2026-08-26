import Link from "next/link";
import type { ReactNode } from "react";
import { CalendarSection } from "@/components/home/CalendarSection";
import { PopupBookLoader } from "@/components/home/book/PopupBookLoader";
import { buildMonthGrid } from "@/lib/homeCalendar";
import { HOME_INFO } from "@/lib/homeConfig";
import { getKstParts } from "@/lib/market";
import {
  getMonthEvents,
  listPosts,
  listScheduleRange,
  listStaff,
} from "@/services/homeContentService";
import type { HomeScheduleEntry } from "@/types/home";

export const dynamic = "force-dynamic";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { month: rawMonth } = await searchParams;
  const today = getKstParts().date;
  const monthMatch = /^\d{4}-(\d{2})$/.exec(rawMonth ?? "");
  const isValidMonth = monthMatch !== null && Number(monthMatch[1]) >= 1 && Number(monthMatch[1]) <= 12;
  const month = isValidMonth ? (rawMonth as string) : today.slice(0, 7);

  const [y, m] = month.split("-").map(Number);
  const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const [events, schedule, staff, latest] = await Promise.all([
    getMonthEvents(month),
    listScheduleRange(`${month}-01`, `${month}-${String(lastDay).padStart(2, "0")}`),
    listStaff(true),
    listPosts({ limit: 5 }),
  ]);

  const weeks = buildMonthGrid(
    month,
    today,
    events.map((e) => ({
      id: e.id,
      title: e.title,
      startDate: e.eventStartDate ?? today,
      endDate: e.eventEndDate,
    })),
    schedule
  );
  const daySchedule: Record<string, HomeScheduleEntry[]> = {};
  for (const entry of schedule) {
    (daySchedule[entry.workDate] ??= []).push(entry);
  }

  // 방 패널 내용은 서버에서 채운다 — 클라이언트 번들엔 문안·목록이 실리지 않는다
  const todayEntries = daySchedule[today] ?? [];
  const staffById = new Map(staff.map((s) => [s.id, s]));
  const panels: Record<string, ReactNode> = {
    office: (
      <p>
        마녀 사장이 이력서 세 장을 심사합니다. 지원자들은 전부 사고를 치고 붙잡혀 감옥에 갇히는데 — 그게 바로 채용이었습니다.
      </p>
    ),
    vault: <p>강시가 훔치려던 돈자루가 있던 곳. 요즘은 요괴 주식 이벤트가 열립니다.</p>,
    street: <p>밤마다 「나라카」 간판이 깜빡입니다. 릴스로 만든 채용 설화를 볼 수 있습니다.</p>,
    house: <p>{HOME_INFO.hoursNote}</p>,
    field: <p>{HOME_INFO.addressLine}</p>,
    jail: (
      <ul className="flex flex-col gap-1">
        {todayEntries.map((e) => {
          const s = staffById.get(e.staffId);
          return s ? <li key={e.id}>{s.name}</li> : null;
        })}
        {todayEntries.length === 0 && (
          <li className="text-[var(--home-sheet-muted)]">오늘 출근표는 아직 안 나왔습니다.</li>
        )}
      </ul>
    ),
    cafe: <p>걸레질·먼지떨이·설거지를 마친 요괴들이 내는 메뉴입니다.</p>,
    plaza: (
      <ul className="flex flex-col gap-1">
        {latest.slice(0, 3).map((p) => (
          <li key={p.id}>
            <Link
              href={p.type === "event" ? `/events/${p.id}` : `/notice/${p.id}`}
              className="underline underline-offset-2"
            >
              {p.title}
            </Link>
          </li>
        ))}
        {latest.length === 0 && (
          <li className="text-[var(--home-sheet-muted)]">아직 전할 소식이 없습니다.</li>
        )}
      </ul>
    ),
  };

  return (
    <main>
      {/* 팝업북 — 표지 정지 이미지를 먼저 그려 LCP 확보, 캔버스는 그 위에 */}
      <div className="home-book-hero">
        <PopupBookLoader panels={panels} />
      </div>
      <p className="mx-auto max-w-3xl px-4 pt-6 text-center text-sm text-[var(--home-muted)]">
        {HOME_INFO.tagline}
      </p>
      <CalendarSection
        month={month}
        weeks={weeks}
        staff={staff}
        daySchedule={daySchedule}
      />

      <section className="mx-auto max-w-3xl px-4 py-6">
        <div className="home-paper home-tape home-paper-tilt p-5 sm:p-7">
        <div className="flex items-center justify-between">
          <h2 className="home-plate text-xl font-semibold">새 소식</h2>
          <Link
            href="/notice"
            className="home-ui inline-flex min-h-11 items-center text-sm hover:text-[var(--home-red)]"
          >
            전체 보기
          </Link>
        </div>
        <ul className="mt-3 flex flex-col gap-2">
          {latest.map((p) => (
            <li key={p.id}>
              <Link
                href={p.type === "event" ? `/events/${p.id}` : `/notice/${p.id}`}
                className="home-card flex min-h-11 items-center gap-2 px-3 py-2 hover:bg-[var(--home-cream)]"
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
                <span className="ml-auto shrink-0 text-xs tabular-nums text-[var(--home-muted)]">
                  {p.publishedAt.slice(0, 10)}
                </span>
              </Link>
            </li>
          ))}
          {latest.length === 0 && (
            <li className="text-sm text-[var(--home-muted)]">
              아직 전할 소식이 없습니다.
            </li>
          )}
        </ul>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-6 pb-12">
        <div className="home-paper home-tape p-5 sm:p-7">
        <h2 className="text-xl font-semibold">오시는 길</h2>
        <p className="mt-2 text-sm text-[var(--home-muted)]">
          {HOME_INFO.addressLine} · {HOME_INFO.hoursNote}
        </p>
        <Link
          href="/location"
          className="home-btn mt-3 inline-flex min-h-11 items-center px-4 text-sm"
        >
          자세히 보기
        </Link>
        </div>
      </section>
    </main>
  );
}
