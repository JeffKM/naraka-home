import Link from "next/link";
import { CalendarSection } from "@/components/home/CalendarSection";
import { ScrubJourney } from "@/components/home/journey/ScrubJourney";
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
  const month = /^\d{4}-\d{2}$/.test(rawMonth ?? "")
    ? (rawMonth as string)
    : today.slice(0, 7);

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
      <section className="mx-auto max-w-3xl px-4 pt-12 text-center">
        <h1 className="text-3xl font-bold tracking-widest">{HOME_INFO.name}</h1>
        <p className="mt-2 text-[var(--home-muted)]">{HOME_INFO.tagline}</p>
      </section>

      <CalendarSection
        month={month}
        weeks={weeks}
        staff={staff}
        daySchedule={daySchedule}
      />

      <section className="mx-auto max-w-3xl px-4 py-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">새 소식</h2>
          <Link href="/notice" className="text-sm underline underline-offset-2">
            전체 보기
          </Link>
        </div>
        <ul className="mt-3 flex flex-col gap-2">
          {latest.map((p) => (
            <li key={p.id}>
              <Link
                href={p.type === "event" ? `/events/${p.id}` : `/notice/${p.id}`}
                className="flex items-baseline gap-2"
              >
                <span className="shrink-0 text-xs text-[var(--home-burgundy)]">
                  {p.type === "event" ? "이벤트" : "공지"}
                </span>
                <span className="truncate">{p.title}</span>
                <span className="ml-auto shrink-0 text-xs text-[var(--home-muted)]">
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
      </section>

      <section className="mx-auto max-w-3xl px-4 py-6">
        <h2 className="text-xl font-bold">오시는 길</h2>
        <p className="mt-2 text-sm text-[var(--home-muted)]">
          {HOME_INFO.addressLine} · {HOME_INFO.hoursNote}
        </p>
        <Link href="/location" className="text-sm underline underline-offset-2">
          자세히 보기
        </Link>
      </section>
    </main>
  );
}
