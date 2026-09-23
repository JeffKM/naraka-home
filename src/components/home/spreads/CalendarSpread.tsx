import { CalendarSection } from "@/components/home/CalendarSection";
import { PageIllust, PageTitle, Spread } from "@/components/home/book/Spread";
import { storySrc } from "@/lib/book/art";
import { loadMonthCalendar } from "@/services/homeCalendarService";

// 달력 + 출근표 쪽 — 홈(?p=calendar)과 이벤트 책 첫 쪽 공용
export async function CalendarSpread({
  rawMonth,
  monthHrefBase,
  title,
  lead,
}: {
  rawMonth: string | undefined;
  monthHrefBase: string;
  title: string;
  lead: string;
}) {
  const { month, weeks, staff, daySchedule } = await loadMonthCalendar(rawMonth);
  return (
    <Spread
      left={
        <>
          <PageTitle>{title}</PageTitle>
          <p className="leading-7">{lead}</p>
          <PageIllust src={storySrc(17)} alt="옥자·미호·멜·바나 단체 사진" />
        </>
      }
      right={
        <CalendarSection
          month={month}
          weeks={weeks}
          staff={staff}
          daySchedule={daySchedule}
          monthHrefBase={monthHrefBase}
        />
      }
    />
  );
}
