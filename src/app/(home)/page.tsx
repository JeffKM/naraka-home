import { HomeDeco } from "@/components/home/HomeDeco";
import Link from "next/link";
import { CalendarSection } from "@/components/home/CalendarSection";
import { ScrubJourney } from "@/components/home/journey/ScrubJourney";
import { StoryTeaser } from "@/components/home/StoryTeaser";
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

  return (
    <main>
      <ScrubJourney />
      <div className="relative">
      <HomeDeco />
      <section className="mx-auto max-w-3xl px-4 pt-12 text-center">
        <p className="home-tally text-sm" aria-hidden>
          {"//// //"}
        </p>
        <h1 className="mt-1 text-3xl font-extrabold">{HOME_INFO.name}</h1>
        <p className="mt-2 text-[var(--home-muted)]">{HOME_INFO.tagline}</p>
      </section>

      <CalendarSection
        month={month}
        weeks={weeks}
        staff={staff}
        daySchedule={daySchedule}
      />

      <StoryTeaser />

      <section className="mx-auto max-w-3xl px-4 py-6">
        <div className="home-paper home-tape home-paper-tilt p-5 sm:p-7">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">새 소식</h2>
          <Link
            href="/notice"
            className="home-ui text-sm hover:text-[var(--home-burgundy)]"
          >
            전체 보기
          </Link>
        </div>
        <ul className="mt-3 flex flex-col gap-2">
          {latest.map((p) => (
            <li key={p.id}>
              <Link
                href={p.type === "event" ? `/events/${p.id}` : `/notice/${p.id}`}
                className="home-card flex items-baseline gap-2 px-3 py-2 hover:bg-[var(--home-bg)]"
              >
                <span
                  className={[
                    "home-tag shrink-0 px-2 text-xs",
                    p.type === "event"
                      ? "bg-[var(--home-burgundy)] text-[var(--home-surface)]"
                      : "bg-[var(--home-amber)] text-[var(--home-ink)]",
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
              아직 등록된 소식이 없습니다.
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
          className="home-btn mt-3 inline-block px-4 py-1.5 text-sm"
        >
          자세히 보기
        </Link>
        </div>
      </section>
      </div>
    </main>
  );
}
