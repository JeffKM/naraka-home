import type { Metadata } from "next";
import { BookMeta } from "@/components/home/book/BookMeta";
import { PageIllust, PageTitle, Spread } from "@/components/home/book/Spread";
import { storySrc } from "@/lib/book/art";
import { ABOUT_MANIFEST } from "@/lib/book/manifest";
import { pageKeyOf } from "@/lib/book/pageKey";
import { HOME_INFO } from "@/lib/homeConfig";

export const metadata: Metadata = {
  title: "소개",
  description: "나라카 이야기 — 지옥이자 감옥이자 직장인 카페, 그리고 세 번의 채용",
};

// 등장 요괴 — 채용 설화 3막(이력서→욕망→행동→응징→감옥→도장)
const CAST = [
  { name: "옥자", role: "마녀 · 나라카의 주인", desc: "한 번도 화내지 않는다. 노려보고, 응징하고, 도장을 찍을 뿐이다." },
  { name: "멜", role: "1막 · 강시", desc: "돈 이야기에 눈이 커진다. 금고를 노리다 발차기에 붙잡혀 걸레를 쥐었다. 도장 — 종신." },
  { name: "바나", role: "2막 · 뱀파이어", desc: "갈증을 참지 못하고 남의 창가에 숨어들다 십자가에 쫓겨 먼지떨이를 쥐었다. 도장 — 종신." },
  { name: "미호", role: "3막 · 구미호", desc: "본인만 모른 채 불을 내고 물대포를 맞은 뒤 수세미를 쥐었다. 도장 — 종신." },
] as const;

// 설화 쪽 — 원화 번호는 스토리 원본 캐러셀 순서
const ACTS = [
  { p: 1, title: "프롤로그", lead: "마녀 사장이 이력서 세 장을 펼쳤습니다. 심사가 시작됩니다.", comics: [13] },
  { p: 2, title: "1막 · 강시 멜", lead: "돈다발 앞에서 눈물을 흘리다 자루째 들고 튀었습니다. 뒤에 마녀가 서 있었습니다.", comics: [1, 2, 3, 4] },
  { p: 3, title: "2막 · 뱀파이어 바나", lead: "잠든 목덜미에 다가가던 순간, 코골이가 터졌습니다. 십자가가 다가옵니다.", comics: [5, 6, 7, 8] },
  { p: 4, title: "3막 · 구미호 미호", lead: "신나서 빙글 돌다 떨어뜨린 푸른 불꽃 하나가 호박밭에 옮겨붙었습니다. 본인만 모릅니다.", comics: [9, 10, 11, 12] },
  { p: 5, title: "피날레", lead: "걸레질, 먼지떨이, 설거지. 붙잡히는 것이 곧 채용이었습니다.", comics: [14, 15, 16, 17] },
] as const;

export default async function AboutPage({ searchParams }: { searchParams: Promise<{ p?: string }> }) {
  const { p } = await searchParams;
  const act = ACTS.find((a) => String(a.p) === p) ?? null;
  const meta = (
    <BookMeta book="about" pageKey={pageKeyOf("/about", act ? `p=${act.p}` : "")} manifest={ABOUT_MANIFEST} />
  );

  if (!act) {
    return (
      <>
        {meta}
        <Spread
          left={
            <>
              <PageTitle>나라카 이야기</PageTitle>
              <p className="leading-7">
                나라카(奈落)는 지옥을 뜻합니다. 이 카페는 지옥이고, 감옥이고, 직장입니다.
                셋은 같은 곳입니다. 그게 이 가게의 유일한 농담이자 전부입니다.
              </p>
              <p className="leading-7 text-[var(--home-sheet-muted)]">
                마녀 사장이 이력서 세 장을 심사했습니다. 지원자들은 전부 사고를 치고 붙잡혀
                감옥에 갇혔는데, 그게 바로 채용이었습니다. 넘겨서 이야기를 읽어 보세요.
              </p>
            </>
          }
          right={
            <div className="flex flex-col gap-3">
              {CAST.map((c) => (
                <div key={c.name} className="home-card p-4">
                  <p className="font-semibold">{c.name}</p>
                  <p className="text-xs text-[var(--home-red)]">{c.role}</p>
                  <p className="mt-2 text-sm text-[var(--home-sheet-muted)]">{c.desc}</p>
                </div>
              ))}
            </div>
          }
        />
      </>
    );
  }

  const [first, ...rest] = act.comics;
  return (
    <>
      {meta}
      <Spread
        left={
          <>
            <PageTitle>{act.title}</PageTitle>
            <p className="leading-7">{act.lead}</p>
            <PageIllust src={storySrc(first)} alt={`${act.title} 원화 ${first}번`} />
          </>
        }
        right={
          <div className="book-comics">
            {rest.map((n) => (
              // eslint-disable-next-line @next/next/no-img-element -- 스토리 원화 정적 WebP
              <img key={n} src={storySrc(n)} alt={`${act.title} 원화 ${n}번`} loading="lazy" />
            ))}
            {act.p === 5 && (
              <a
                href={HOME_INFO.instagramUrl}
                target="_blank"
                rel="noreferrer"
                className="home-btn home-btn-primary inline-flex min-h-11 w-fit items-center px-5"
              >
                instagram @{HOME_INFO.instagramHandle}
              </a>
            )}
            {rest.length === 0 && <p className="leading-7 text-[var(--home-sheet-muted)]">다음 장을 넘기면 1막이 시작됩니다.</p>}
          </div>
        }
      />
    </>
  );
}
