import { BookMeta } from "@/components/home/book/BookMeta";
import { CalendarSpread } from "@/components/home/spreads/CalendarSpread";
import { NewsSpread, TodaySpread, VisitSpread } from "@/components/home/spreads/HomeSpreads";
import { HOME_MANIFEST } from "@/lib/book/manifest";
import { pageKeyOf } from "@/lib/book/pageKey";

export const dynamic = "force-dynamic";

type HomeSubPage = "calendar" | "news" | "visit" | null;

function parsePage(raw: string | undefined): HomeSubPage {
  return raw === "calendar" || raw === "news" || raw === "visit" ? raw : null;
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ p?: string; month?: string }>;
}) {
  const sp = await searchParams;
  const page = parsePage(sp.p);
  return (
    <>
      <BookMeta book="home" pageKey={pageKeyOf("/", page ? `p=${page}` : "")} manifest={HOME_MANIFEST} />
      {page === "calendar" ? (
        <CalendarSpread
          rawMonth={sp.month}
          monthHrefBase="/?p=calendar&month="
          title="이달의 나라카"
          lead="날짜를 누르면 그날 열리는 이벤트와 출근하는 요괴가 보여요."
        />
      ) : page === "news" ? (
        <NewsSpread />
      ) : page === "visit" ? (
        <VisitSpread />
      ) : (
        <TodaySpread />
      )}
    </>
  );
}
