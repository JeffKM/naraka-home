import { HomeDeco } from "@/components/home/HomeDeco";
import type { Metadata } from "next";
import { HOME_INFO } from "@/lib/homeConfig";

export const metadata: Metadata = {
  title: "소개",
  description: "나라카 이야기 — 지옥이자 감옥이자 직장인 카페, 그리고 세 번의 채용",
};

// 등장 요괴 — 채용 설화 3막(이력서→욕망→행동→응징→감옥→도장)을 인물 카드에 통합
const CAST = [
  {
    name: "옥자",
    role: "마녀 · 나라카의 주인",
    desc: "한 번도 화내지 않는다. 노려보고, 응징하고, 도장을 찍을 뿐이다.",
  },
  {
    name: "멜",
    role: "1막 · 강시",
    desc: "돈 이야기에 눈이 커진다. 금고를 노리다 발차기에 붙잡혀 걸레를 쥐었다. 도장 — 종신.",
  },
  {
    name: "바나",
    role: "2막 · 뱀파이어",
    desc: "갈증을 참지 못하고 남의 창가에 숨어들다 십자가에 쫓겨 먼지떨이를 쥐었다. 도장 — 종신.",
  },
  {
    name: "미호",
    role: "3막 · 구미호",
    desc: "본인만 모른 채 불을 내고 물대포를 맞은 뒤 수세미를 쥐었다. 도장 — 종신.",
  },
] as const;

const COMIC_COUNT = 17;

export default function AboutPage() {
  return (
    <>
      <HomeDeco />
      <main className="mx-auto max-w-3xl px-4 py-10">
        <div className="home-paper p-5 sm:p-8">
          <h1 className="text-2xl font-bold">나라카 이야기</h1>
          <p className="mt-4 leading-7">
            나라카(奈落)는 지옥을 뜻합니다. 이 카페는 지옥이고, 감옥이고, 직장입니다.
            셋은 같은 곳입니다 — 그게 이 가게의 유일한 농담이자 전부입니다.
          </p>
          <p className="mt-2 leading-7 text-[var(--home-muted)]">
            마녀 사장이 이력서 세 장을 심사했습니다. 지원자들은 전부 사고를 치고
            붙잡혀 감옥에 갇혔는데 — 그게 바로 채용이었습니다.
          </p>

          <div className="mx-auto mt-6 w-full max-w-[420px]">
            {/* 모바일: 9:16 풀폭 플레이어 */}
            <video
              className="w-full rounded-lg sm:hidden"
              controls
              playsInline
              preload="none"
              poster="/story/poster.webp"
              src="/story/naraka-story.mp4"
              aria-label="나라카 채용 설화 애니메이션"
            />
            {/* 데스크톱: 인스타 프레임 목업 안 재생 */}
            <div className="relative hidden aspect-[9/16] sm:block">
              <video
                className="absolute left-[10.19%] top-[8.13%] h-[79.64%] w-[79.63%] object-cover"
                controls
                preload="none"
                poster="/story/poster.webp"
                src="/story/naraka-story.mp4"
                aria-label="나라카 채용 설화 애니메이션"
              />
              {/* eslint-disable-next-line @next/next/no-img-element -- 설화 에셋 */}
              <img
                src="/story/insta-frame.webp"
                alt=""
                className="pointer-events-none absolute inset-0 size-full"
              />
            </div>
          </div>

          <h2 className="home-plate mt-10 text-xl font-bold">요괴들</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {CAST.map((c) => (
              <div key={c.name} className="home-card p-4">
                <p className="font-semibold">{c.name}</p>
                <p className="text-xs text-[var(--home-red)]">{c.role}</p>
                <p className="mt-2 text-sm text-[var(--home-muted)]">{c.desc}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm leading-6 text-[var(--home-muted)]">
            붙잡히는 것이 곧 채용 — 감옥은 직원 휴게실이고, 벽의 형기 빗금은
            근속이 됩니다. 오늘도 요괴들이 손님을 맞이합니다.
          </p>

          <h2 className="home-plate mt-10 text-xl font-bold">원화 컷</h2>
          <div className="scrollbar-none -mx-4 mt-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4">
            {Array.from({ length: COMIC_COUNT }, (_, i) => (
              // eslint-disable-next-line @next/next/no-img-element -- 설화 원화
              <img
                key={i}
                src={`/story/comic/${String(i + 1).padStart(2, "0")}.webp`}
                alt={`채용 설화 원화 ${i + 1}번`}
                loading="lazy"
                className="w-4/5 max-w-[360px] shrink-0 snap-center rounded-lg border border-[var(--home-line)]"
              />
            ))}
          </div>

          <div className="mt-8 text-center">
            <a
              href={HOME_INFO.instagramUrl}
              target="_blank"
              rel="noreferrer"
              className="home-btn home-btn-primary px-5 py-2"
            >
              instagram @{HOME_INFO.instagramHandle}
            </a>
          </div>
        </div>
      </main>
    </>
  );
}
